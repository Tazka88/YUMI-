import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Search,
  Download,
  Mail,
  MessageCircle,
  Ticket,
  Users,
  ShoppingBag,
  Phone,
  Check,
  Copy,
  X,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';

export interface CustomerContact {
  email_key: string;
  email: string;
  name: string;
  phone: string;
  wilaya: string;
  commune: string;
  is_registered: boolean;
  user_id?: string | null;
  auth_provider?: 'google' | 'email' | null;
  registered_at?: string | null;
  last_sign_in_at?: string | null;
  orders_count: number;
  total_spent: number;
  last_order_at?: string | null;
  is_subscriber: boolean;
  subscriber_source?: string | null;
  subscribed_at?: string | null;
  active_vouchers_count: number;
  active_vouchers_balance: number;
  total_vouchers_count: number;
  latest_voucher_code?: string | null;
  latest_voucher_amount?: number | null;
  latest_voucher_min_cart?: number | null;
  latest_voucher_expires_at?: string | null;
  source: string;
  created_at?: string | null;
}

interface EmailBaseStats {
  total_contacts: number;
  registered_count: number;
  buyers_count: number;
  discount_offer_count: number;
  newsletter_count: number;
  with_phone_count: number;
  with_active_voucher_count: number;
}

type SegmentKey =
  | 'registered'
  | 'all'
  | 'orders'
  | 'discount_offer'
  | 'with_phone'
  | 'with_voucher'
  | 'Newsletter';

interface VoucherTier {
  amount: number;
  minCart: number;
}

const DEFAULT_VOUCHER_TIERS: VoucherTier[] = [
  { amount: 500, minCart: 10000 },
  { amount: 1000, minCart: 15000 },
  { amount: 2000, minCart: 30000 },
];

const QUICK_VOUCHER_REASONS = [
  'Geste commercial fidélité',
  'Produit manquant / incomplet',
  'Retard de livraison',
  'Compensation service client',
];

function normalizeAlgerianPhoneForWa(rawPhone: string): string | null {
  if (!rawPhone) return null;
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00213')) return digits.slice(2);
  if (digits.startsWith('213') && digits.length >= 11) return digits;
  if (digits.startsWith('0') && digits.length === 10) return `213${digits.slice(1)}`;
  if ((digits.startsWith('5') || digits.startsWith('6') || digits.startsWith('7')) && digits.length === 9) {
    return `213${digits}`;
  }
  if (digits.length >= 9) return digits;
  return null;
}

function formatDateFr(dateValue?: string | null): string {
  if (!dateValue) return '—';
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getDefaultExpiryDate(days = 60): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function CustomerEmailsAdmin() {
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [stats, setStats] = useState<EmailBaseStats>({
    total_contacts: 0,
    registered_count: 0,
    buyers_count: 0,
    discount_offer_count: 0,
    newsletter_count: 0,
    with_phone_count: 0,
    with_active_voucher_count: 0,
  });

  const [segment, setSegment] = useState<SegmentKey>('registered');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exportingCsv, setExportingCsv] = useState(false);

  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  // Resend email config status
  const [emailConfig, setEmailConfig] = useState<{ configured: boolean; fromEmail: string }>({
    configured: true,
    fromEmail: '',
  });

  // Voucher tiers from server config
  const [tiers, setTiers] = useState<VoucherTier[]>(DEFAULT_VOUCHER_TIERS);

  // Quick Voucher Issue Modal
  const [voucherModalContact, setVoucherModalContact] = useState<CustomerContact | null>(null);
  const [voucherForm, setVoucherForm] = useState({
    code: '',
    amount: 1000,
    isCustomAmount: false,
    minimum_order_amount: 15000,
    reason: 'Geste commercial fidélité',
    has_expiry: true,
    expires_at: getDefaultExpiryDate(60),
    allow_promo_stacking: false,
  });
  const [issuingVoucher, setIssuingVoucher] = useState(false);
  const [issuedVoucherSuccess, setIssuedVoucherSuccess] = useState<{
    contact: CustomerContact;
    code: string;
    amount: number;
    minimum_order_amount: number;
    expires_at?: string | null;
  } | null>(null);

  // Email Composer Modal (single or bulk)
  const [emailModal, setEmailModal] = useState<{
    isOpen: boolean;
    targets: CustomerContact[];
    subject: string;
    message: string;
    includeVoucherCard: boolean;
    voucherOverride?: {
      code: string;
      amount: number;
      minCart: number;
      expiresAt?: string | null;
    } | null;
  }>({
    isOpen: false,
    targets: [],
    subject: '',
    message: '',
    includeVoucherCard: false,
    voucherOverride: null,
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendEmailError, setSendEmailError] = useState<string | null>(null);

  // WhatsApp Modal
  const [waModal, setWaModal] = useState<{
    contact: CustomerContact | null;
    lang: 'fr' | 'ar';
    templateType: 'voucher' | 'promo' | 'custom';
    message: string;
    voucherOverride?: {
      code: string;
      amount: number;
      minCart: number;
      expiresAt?: string | null;
    } | null;
  }>({
    contact: null,
    lang: 'fr',
    templateType: 'voucher',
    message: '',
    voucherOverride: null,
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
    setSelectedEmails([]);
  }, [segment]);

  const fetchEmailConfigAndTiers = async () => {
    try {
      const [cfgRes, tiersRes] = await Promise.all([
        fetch('/api/admin/emails/config', { headers: getAuthHeaders() }),
        fetch('/api/admin/vouchers/config', { headers: getAuthHeaders() }),
      ]);
      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        setEmailConfig({
          configured: Boolean(cfg.configured),
          fromEmail: String(cfg.fromEmail || ''),
        });
      }
      if (tiersRes.ok) {
        const tData = await tiersRes.json();
        if (Array.isArray(tData.tiers) && tData.tiers.length > 0) {
          setTiers(tData.tiers);
        }
      }
    } catch (_) {}
  };

  const fetchContacts = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const sp = new URLSearchParams();
      sp.set('segment', segment);
      sp.set('page', String(page));
      sp.set('limit', '50');
      if (debouncedSearch) sp.set('search', debouncedSearch);

      const res = await fetch(`/api/admin/emails?${sp.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Impossible de charger la base clients');

      setContacts(Array.isArray(data.emails) ? data.emails : []);
      setTotalCount(Number(data.totalCount || 0));
      setTotalPages(Math.max(1, Number(data.totalPages || 1)));
      if (data.stats) setStats(data.stats);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors du chargement des contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailConfigAndTiers();
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [segment, page, debouncedSearch]);

  const handleCopy = (val: string, label = 'Copié') => {
    navigator.clipboard.writeText(val);
    setCopiedValue(val);
    toast.success(`${label} : ${val}`);
    setTimeout(() => setCopiedValue((prev) => (prev === val ? null : prev)), 2000);
  };

  // Selection helpers
  const allVisibleKeys = useMemo(() => contacts.map((c) => c.email_key), [contacts]);
  const allVisibleSelected =
    allVisibleKeys.length > 0 && allVisibleKeys.every((k) => selectedEmails.includes(k));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedEmails((prev) => prev.filter((k) => !allVisibleKeys.includes(k)));
    } else {
      setSelectedEmails((prev) => Array.from(new Set([...prev, ...allVisibleKeys])));
    }
  };

  const toggleSelectOne = (emailKey: string) => {
    setSelectedEmails((prev) =>
      prev.includes(emailKey) ? prev.filter((k) => k !== emailKey) : [...prev, emailKey]
    );
  };

  const selectedContacts = useMemo(
    () => contacts.filter((c) => selectedEmails.includes(c.email_key)),
    [contacts, selectedEmails]
  );

  // CSV Export of full filtered segment
  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      const sp = new URLSearchParams();
      sp.set('segment', segment);
      sp.set('all', 'true');
      if (debouncedSearch) sp.set('search', debouncedSearch);

      const res = await fetch(`/api/admin/emails?${sp.toString()}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'export");

      const rowsToExport: CustomerContact[] = Array.isArray(data.emails) ? data.emails : [];
      if (rowsToExport.length === 0) {
        toast.error('Aucun contact à exporter pour ce filtre.');
        return;
      }

      const headers = [
        'Email',
        'Nom',
        'Téléphone',
        'Wilaya',
        'Commune',
        'Compte inscrit',
        'Méthode inscription',
        'Commandes',
        'Total dépensé (DA)',
        'Bons actifs',
        'Solde bons (DA)',
        'Dernier code bon',
        'Source principale',
        'Date',
      ];

      const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;

      const csvLines = [
        headers.join(','),
        ...rowsToExport.map((c) =>
          [
            esc(c.email),
            esc(c.name || ''),
            esc(c.phone || ''),
            esc(c.wilaya || ''),
            esc(c.commune || ''),
            esc(c.is_registered ? 'Oui' : 'Non'),
            esc(c.is_registered ? (c.auth_provider === 'google' ? 'Google' : 'Email') : '—'),
            esc(c.orders_count || 0),
            esc(Math.round(Number(c.total_spent || 0))),
            esc(c.active_vouchers_count || 0),
            esc(Math.round(Number(c.active_vouchers_balance || 0))),
            esc(c.latest_voucher_code || ''),
            esc(c.source || ''),
            esc(formatDateFr(c.created_at)),
          ].join(',')
        ),
      ];

      const csvContent = '\uFEFF' + csvLines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `clients_zorando_${segment}_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`${rowsToExport.length} contact(s) exporté(s) en CSV.`);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'export CSV");
    } finally {
      setExportingCsv(false);
    }
  };

  // --- QUICK VOUCHER MODAL ---
  const openQuickVoucherModal = async (contact: CustomerContact) => {
    if (!contact.is_registered || !contact.user_id) {
      toast.error("Ce contact n'a pas encore de compte enregistré sur le site.");
      return;
    }
    setIssuedVoucherSuccess(null);
    setVoucherModalContact(contact);
    const defaultTier = tiers.find((t) => t.amount === 1000) || tiers[0] || DEFAULT_VOUCHER_TIERS[1];
    setVoucherForm({
      code: '',
      amount: defaultTier.amount,
      isCustomAmount: false,
      minimum_order_amount: defaultTier.minCart,
      reason: 'Geste commercial fidélité',
      has_expiry: true,
      expires_at: getDefaultExpiryDate(60),
      allow_promo_stacking: false,
    });

    try {
      const res = await fetch('/api/admin/vouchers/generate-code', { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok && data.code) {
        setVoucherForm((prev) => ({ ...prev, code: data.code }));
      }
    } catch (_) {}
  };

  const handleIssueVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherModalContact || !voucherModalContact.user_id) return;

    if (voucherForm.amount <= 0) {
      toast.error('Le montant du bon doit être supérieur à 0 DA.');
      return;
    }
    if (voucherForm.minimum_order_amount > 0 && voucherForm.amount >= voucherForm.minimum_order_amount) {
      toast.error('Le montant du bon doit être inférieur au panier minimum requis.');
      return;
    }

    setIssuingVoucher(true);
    try {
      const expiresAtIso =
        voucherForm.has_expiry && voucherForm.expires_at
          ? new Date(`${voucherForm.expires_at}T23:59:59`).toISOString()
          : null;

      const res = await fetch('/api/admin/vouchers', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_id: voucherModalContact.user_id,
          code: voucherForm.code.trim().toUpperCase(),
          amount: Number(voucherForm.amount),
          minimum_order_amount: Number(voucherForm.minimum_order_amount),
          reason: voucherForm.reason.trim() || 'Geste commercial ZORANDO',
          expires_at: expiresAtIso,
          allow_promo_stacking: voucherForm.allow_promo_stacking,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible d'attribuer le bon d'achat");

      toast.success(`Bon d'achat ${data.code} attribué à ${voucherModalContact.email} !`);
      setIssuedVoucherSuccess({
        contact: voucherModalContact,
        code: data.code,
        amount: Number(data.amount),
        minimum_order_amount: Number(data.minimum_order_amount),
        expires_at: data.expires_at,
      });
      fetchContacts();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'attribution du bon");
    } finally {
      setIssuingVoucher(false);
    }
  };

  // --- EMAIL COMPOSER MODAL ---
  const buildEmailDraft = (
    targets: CustomerContact[],
    template: 'voucher' | 'promo' | 'custom',
    voucherOverride?: { code: string; amount: number; minCart: number; expiresAt?: string | null } | null
  ) => {
    const single = targets.length === 1 ? targets[0] : null;
    const activeCode = voucherOverride?.code || single?.latest_voucher_code;
    const activeAmount = voucherOverride?.amount || single?.latest_voucher_amount;
    const activeMinCart =
      voucherOverride?.minCart !== undefined
        ? voucherOverride.minCart
        : Number(single?.latest_voucher_min_cart || 0);

    if (template === 'voucher' && activeCode && activeAmount) {
      const amountTxt = formatPrice(activeAmount);
      const minTxt = activeMinCart > 0 ? ` dès ${formatPrice(activeMinCart)} d'achats (hors livraison)` : '';
      return {
        subject: `Votre bon d'achat de ${amountTxt} est disponible sur ZORANDO`,
        message: `Nous avons le plaisir de vous offrir un bon d'achat d'une valeur de ${amountTxt} valable sur www.zorando.com.\n\nVotre code personnel (${activeCode}) est déjà enregistré dans votre espace client "Mes bons d'achat" et utilisable${minTxt}.\n\nN'hésitez pas à passer commande ou à nous contacter si vous avez la moindre question.`,
        includeVoucherCard: true,
      };
    }

    if (template === 'voucher') {
      return {
        subject: "Votre avantage client ZORANDO vous attend !",
        message:
          "Nous vous informons qu'un avantage spécial est disponible sur votre compte client ZORANDO.\n\nConnectez-vous sur www.zorando.com pour découvrir nos nouveautés et profiter de votre réduction lors de votre prochaine commande.",
        includeVoucherCard: false,
      };
    }

    if (template === 'promo') {
      return {
        subject: 'Offres spéciales & nouveautés sur ZORANDO Algérie',
        message:
          'Découvrez nos nouvelles arrivages et nos offres du moment sur www.zorando.com !\n\nProfitez de la livraison rapide dans les 58 wilayas et du paiement à la livraison.',
        includeVoucherCard: false,
      };
    }

    return {
      subject: 'Message de l’équipe ZORANDO',
      message: '',
      includeVoucherCard: false,
    };
  };

  const openEmailComposer = (
    targets: CustomerContact[],
    voucherOverride?: { code: string; amount: number; minCart: number; expiresAt?: string | null } | null
  ) => {
    setSendEmailError(null);
    const single = targets.length === 1 ? targets[0] : null;
    const hasVoucher = Boolean(voucherOverride?.code || (single && single.latest_voucher_code));
    const draft = buildEmailDraft(targets, hasVoucher ? 'voucher' : 'promo', voucherOverride);

    setEmailModal({
      isOpen: true,
      targets,
      subject: draft.subject,
      message: draft.message,
      includeVoucherCard: draft.includeVoucherCard,
      voucherOverride: voucherOverride || null,
    });
  };

  const applyEmailTemplate = (template: 'voucher' | 'promo' | 'custom') => {
    const draft = buildEmailDraft(emailModal.targets, template, emailModal.voucherOverride);
    setEmailModal((prev) => ({
      ...prev,
      subject: draft.subject,
      message: draft.message,
      includeVoucherCard: draft.includeVoucherCard,
    }));
  };

  const handleSendEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailModal.targets.length === 0) return;

    setSendingEmail(true);
    setSendEmailError(null);
    try {
      const single = emailModal.targets.length === 1 ? emailModal.targets[0] : null;
      const voucherPayload =
        emailModal.includeVoucherCard && (emailModal.voucherOverride || single?.latest_voucher_code)
          ? {
              voucherCode: emailModal.voucherOverride?.code || single?.latest_voucher_code || undefined,
              voucherAmount: emailModal.voucherOverride?.amount || single?.latest_voucher_amount || undefined,
              voucherMinCart:
                emailModal.voucherOverride?.minCart ?? single?.latest_voucher_min_cart ?? undefined,
              voucherExpiresAt:
                emailModal.voucherOverride?.expiresAt ?? single?.latest_voucher_expires_at ?? undefined,
            }
          : {};

      const payload =
        emailModal.targets.length === 1
          ? {
              to: emailModal.targets[0].email,
              customerName: emailModal.targets[0].name || undefined,
              subject: emailModal.subject,
              message: emailModal.message,
              ...voucherPayload,
            }
          : {
              recipients: emailModal.targets.map((t) => ({
                email: t.email,
                name: t.name || undefined,
              })),
              subject: emailModal.subject,
              message: emailModal.message,
            };

      const res = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec de l'envoi de l'email.");
      }

      toast.success(
        data.sentCount > 1
          ? `${data.sentCount} emails envoyés avec succès !`
          : `Email envoyé à ${emailModal.targets[0].email} !`
      );
      setEmailModal((prev) => ({ ...prev, isOpen: false }));
      setSelectedEmails([]);
    } catch (err: any) {
      setSendEmailError(err.message || "Erreur lors de l'envoi");
      toast.error(err.message || "Erreur lors de l'envoi de l'email");
    } finally {
      setSendingEmail(false);
    }
  };

  // --- WHATSAPP COMPOSER MODAL ---
  const buildWhatsappText = (
    contact: CustomerContact,
    lang: 'fr' | 'ar',
    templateType: 'voucher' | 'promo' | 'custom',
    voucherOverride?: { code: string; amount: number; minCart: number; expiresAt?: string | null } | null
  ) => {
    const firstName = (contact.name || '').trim().split(' ')[0] || (lang === 'fr' ? 'Cher client' : 'زبوننا الكريم');
    const code = voucherOverride?.code || contact.latest_voucher_code;
    const amount = voucherOverride?.amount || contact.latest_voucher_amount;
    const minCart =
      voucherOverride?.minCart !== undefined
        ? voucherOverride.minCart
        : Number(contact.latest_voucher_min_cart || 0);

    if (lang === 'ar') {
      if (templateType === 'voucher' && code && amount) {
        const minPart = minCart > 0 ? ` للطلبات ابتداءً من ${formatPrice(minCart)} (دون احتساب التوصيل)` : '';
        return `السلام عليكم ${firstName} 🧡\nيسعدنا في ZORANDO إعلامكم أنه تم منحكم قسيمة شراء بقيمة ${formatPrice(amount)}!\n\nالكود الخاص بكم: *${code}*${minPart}\nتجدون القسيمة مباشرة في حسابكم على:\nhttps://www.zorando.com/account/vouchers\n\nمرحباً بكم في أي وقت.`;
      }
      if (templateType === 'voucher') {
        return `السلام عليكم ${firstName} 🧡\nلديكم هدية / تخفيض خاص على حسابكم في متجر ZORANDO!\nتصفحوا أحدث العروض على:\nhttps://www.zorando.com`;
      }
      if (templateType === 'promo') {
        return `السلام عليكم ${firstName} 🧡\nاكتشفوا أحدث العروض والتخفيضات الحصرية الآن على متجر ZORANDO مع توصيل سريع لـ 58 ولاية والدفع عند الاستلام:\nhttps://www.zorando.com`;
      }
      return `السلام عليكم ${firstName}، معكم فريق ZORANDO. `;
    }

    if (templateType === 'voucher' && code && amount) {
      const minPart = minCart > 0 ? ` dès ${formatPrice(minCart)} d'achats (hors livraison)` : '';
      return `Bonjour ${firstName},\n\nBonne nouvelle de la part de ZORANDO ! Un bon d'achat de *${formatPrice(amount)}* a été crédité sur votre compte client.\n\nCode : *${code}*${minPart}\nVous pouvez l'utiliser directement au panier ou le consulter dans votre espace :\nhttps://www.zorando.com/account/vouchers`;
    }
    if (templateType === 'voucher') {
      return `Bonjour ${firstName},\n\nUn avantage client ZORANDO vous attend sur votre compte ! Connectez-vous sur https://www.zorando.com/account/vouchers pour en profiter lors de votre prochaine commande.`;
    }
    if (templateType === 'promo') {
      return `Bonjour ${firstName},\n\nDécouvrez nos nouvelles offres et promotions du moment sur ZORANDO Algérie !\nLivraison rapide 58 wilayas et paiement à la réception : https://www.zorando.com`;
    }
    return `Bonjour ${firstName}, ici l'équipe ZORANDO Algérie. `;
  };

  const openWhatsappModal = (
    contact: CustomerContact,
    voucherOverride?: { code: string; amount: number; minCart: number; expiresAt?: string | null } | null
  ) => {
    const waPhone = normalizeAlgerianPhoneForWa(contact.phone);
    if (!waPhone) {
      toast.error('Ce client ne dispose pas de numéro de téléphone valide.');
      return;
    }
    const hasVoucher = Boolean(voucherOverride?.code || contact.latest_voucher_code);
    const tpl: 'voucher' | 'promo' = hasVoucher ? 'voucher' : 'promo';
    setWaModal({
      contact,
      lang: 'fr',
      templateType: tpl,
      message: buildWhatsappText(contact, 'fr', tpl, voucherOverride),
      voucherOverride: voucherOverride || null,
    });
  };

  const updateWaTemplate = (lang: 'fr' | 'ar', templateType: 'voucher' | 'promo' | 'custom') => {
    if (!waModal.contact) return;
    setWaModal((prev) => ({
      ...prev,
      lang,
      templateType,
      message: buildWhatsappText(waModal.contact!, lang, templateType, prev.voucherOverride),
    }));
  };

  const launchWhatsappUrl = () => {
    if (!waModal.contact) return;
    const waPhone = normalizeAlgerianPhoneForWa(waModal.contact.phone);
    if (!waPhone) return;
    const url = `https://wa.me/${waPhone}?text=${encodeURIComponent(waModal.message)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const segments: Array<{ key: SegmentKey; label: string; count: number; hint: string }> = [
    {
      key: 'registered',
      label: 'Inscrits sur le site',
      count: stats.registered_count,
      hint: 'Comptes clients enregistrés (peuvent recevoir un bon d’achat)',
    },
    {
      key: 'all',
      label: 'Tous les contacts',
      count: stats.total_contacts,
      hint: 'Base complète dédupliquée par adresse email',
    },
    {
      key: 'orders',
      label: 'Acheteurs',
      count: stats.buyers_count,
      hint: 'Clients ayant déjà passé au moins une commande',
    },
    {
      key: 'discount_offer',
      label: 'Pop-up Offres',
      count: stats.discount_offer_count,
      hint: 'Emails capturés via l’offre pop-up du site',
    },
    {
      key: 'with_phone',
      label: 'WhatsApp joignables',
      count: stats.with_phone_count,
      hint: 'Contacts disposant d’un numéro de téléphone',
    },
    {
      key: 'with_voucher',
      label: 'Avec bon actif',
      count: stats.with_active_voucher_count,
      hint: 'Inscrits ayant actuellement un bon d’achat disponible',
    },
  ];

  if (stats.newsletter_count > 0) {
    segments.push({
      key: 'Newsletter',
      label: 'Newsletter',
      count: stats.newsletter_count,
      hint: 'Inscrits à la newsletter',
    });
  }

  return (
    <div className="space-y-6">
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setSegment('registered')}
          className={`text-left p-5 rounded-xl border transition bg-white ${
            segment === 'registered'
              ? 'border-orange-500 ring-1 ring-orange-500/20'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Inscrits sur le site</span>
            <UserCheck size={17} className="text-orange-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">
            {stats.registered_count.toLocaleString('fr-FR')}
          </p>
          <p className="mt-1 text-xs text-gray-500">Comptes éligibles aux bons d&apos;achat</p>
        </button>

        <button
          type="button"
          onClick={() => setSegment('orders')}
          className={`text-left p-5 rounded-xl border transition bg-white ${
            segment === 'orders'
              ? 'border-orange-500 ring-1 ring-orange-500/20'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Clients acheteurs</span>
            <ShoppingBag size={17} className="text-gray-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">
            {stats.buyers_count.toLocaleString('fr-FR')}
          </p>
          <p className="mt-1 text-xs text-gray-500">Contacts avec au moins 1 commande</p>
        </button>

        <button
          type="button"
          onClick={() => setSegment('with_phone')}
          className={`text-left p-5 rounded-xl border transition bg-white ${
            segment === 'with_phone'
              ? 'border-orange-500 ring-1 ring-orange-500/20'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Joignables WhatsApp</span>
            <Phone size={17} className="text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">
            {stats.with_phone_count.toLocaleString('fr-FR')}
          </p>
          <p className="mt-1 text-xs text-gray-500">Contacts avec numéro enregistré</p>
        </button>

        <button
          type="button"
          onClick={() => setSegment('with_voucher')}
          className={`text-left p-5 rounded-xl border transition bg-white ${
            segment === 'with_voucher'
              ? 'border-orange-500 ring-1 ring-orange-500/20'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Clients avec bon actif</span>
            <Ticket size={17} className="text-orange-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 tabular-nums">
            {stats.with_active_voucher_count.toLocaleString('fr-FR')}
          </p>
          <p className="mt-1 text-xs text-gray-500">Bons disponibles prêts à être utilisés</p>
        </button>
      </div>

      {/* Main Directory Container */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Top Toolbar */}
        <div className="p-5 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {segments.find((s) => s.key === segment)?.label || 'Répertoire Clients'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {segments.find((s) => s.key === segment)?.hint}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative sm:w-80">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Rechercher email, nom, tél, wilaya, code..."
                className="w-full pl-10 pr-8 py-2.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Effacer la recherche"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exportingCsv}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              <Download size={16} />
              <span>{exportingCsv ? 'Export en cours...' : 'Exporter CSV'}</span>
            </button>
          </div>
        </div>

        {/* Clean Segmented Tabs */}
        <div className="px-5 py-3 bg-gray-50/70 border-b border-gray-200 flex items-center gap-2 overflow-x-auto">
          {segments.map((seg) => {
            const active = segment === seg.key;
            return (
              <button
                key={seg.key}
                type="button"
                onClick={() => setSegment(seg.key)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 flex items-center gap-2 ${
                  active
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>{seg.label}</span>
                <span
                  className={`tabular-nums text-[11px] font-bold ${
                    active ? 'text-orange-100' : 'text-gray-400'
                  }`}
                >
                  {seg.count.toLocaleString('fr-FR')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bulk Selection Bar */}
        {selectedEmails.length > 0 && (
          <div className="px-5 py-3 bg-orange-50 border-b border-orange-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-gray-900">
              <span className="tabular-nums">{selectedEmails.length}</span> client(s) sélectionné(s)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openEmailComposer(selectedContacts)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition whitespace-nowrap shrink-0"
              >
                <Mail size={14} />
                <span>Envoyer un email groupé ({selectedContacts.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedEmails([])}
                className="px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900"
              >
                Désélectionner
              </button>
            </div>
          </div>
        )}

        {/* Error state */}
        {errorMsg && (
          <div className="p-6 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-red-600 font-medium">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-500">
                <th className="py-3.5 pl-5 pr-3 w-10">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    aria-label="Tout sélectionner sur cette page"
                    className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                </th>
                <th className="py-3.5 px-3">Client &amp; Email</th>
                <th className="py-3.5 px-3">Téléphone &amp; Wilaya</th>
                <th className="py-3.5 px-3">Commandes</th>
                <th className="py-3.5 px-3">Bon d&apos;achat actif</th>
                <th className="py-3.5 px-3">Date</th>
                <th className="py-3.5 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 pl-5 pr-3">
                      <div className="w-4 h-4 bg-gray-200 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="h-4 w-44 bg-gray-200 rounded mb-1.5" />
                      <div className="h-3 w-32 bg-gray-100 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="h-4 w-28 bg-gray-200 rounded mb-1.5" />
                      <div className="h-3 w-20 bg-gray-100 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="h-4 w-24 bg-gray-100 rounded" />
                    </td>
                    <td className="py-4 px-3">
                      <div className="h-4 w-20 bg-gray-100 rounded" />
                    </td>
                    <td className="py-4 pl-3 pr-5 text-right">
                      <div className="h-8 w-44 bg-gray-100 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 px-6 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-10 h-10 text-gray-300" />
                      <p className="font-semibold text-gray-700">Aucun contact trouvé</p>
                      <p className="text-xs text-gray-500">
                        Modifiez votre recherche ou changez de segment pour afficher d&apos;autres contacts.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => {
                  const waNumber = normalizeAlgerianPhoneForWa(contact.phone);
                  const isSelected = selectedEmails.includes(contact.email_key);
                  const displayName =
                    contact.name && contact.name.trim() !== ''
                      ? contact.name
                      : contact.email.split('@')[0];

                  const originText = contact.is_registered
                    ? `Compte inscrit · ${contact.auth_provider === 'google' ? 'Google' : 'Email'}`
                    : contact.orders_count > 0
                      ? 'Client invité (commande)'
                      : contact.subscriber_source === 'discount_offer'
                        ? 'Pop-up offre livraison'
                        : contact.subscriber_source || 'Newsletter';

                  return (
                    <tr
                      key={contact.email_key}
                      className={`transition-colors ${
                        isSelected ? 'bg-orange-50/40' : 'hover:bg-gray-50/80'
                      }`}
                    >
                      <td className="py-3.5 pl-5 pr-3 align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(contact.email_key)}
                          aria-label={`Sélectionner ${contact.email}`}
                          className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                      </td>

                      {/* Client & Email */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="font-semibold text-gray-900 truncate max-w-[260px]">
                          {displayName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-gray-600 truncate max-w-[240px]">
                            {contact.email}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(contact.email, 'Email copié')}
                            className="text-gray-400 hover:text-gray-700 shrink-0"
                            title="Copier l'email"
                          >
                            {copiedValue === contact.email ? (
                              <Check size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                          <span className={contact.is_registered ? 'text-emerald-700 font-medium' : ''}>
                            {originText}
                          </span>
                          {contact.is_registered && contact.is_subscriber && contact.subscriber_source === 'discount_offer' && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Pop-up offre</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Phone & Wilaya */}
                      <td className="py-3.5 px-3 align-middle">
                        {contact.phone ? (
                          <div className="font-medium text-gray-900 tabular-nums text-xs">
                            {contact.phone}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">Non renseigné</div>
                        )}
                        <div className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[170px]">
                          {[contact.wilaya, contact.commune].filter(Boolean).join(' · ') || '—'}
                        </div>
                      </td>

                      {/* Orders */}
                      <td className="py-3.5 px-3 align-middle tabular-nums">
                        {contact.orders_count > 0 ? (
                          <div>
                            <div className="font-semibold text-gray-900 text-xs">
                              {contact.orders_count} cmd
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {formatPrice(contact.total_spent)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Aucune</span>
                        )}
                      </td>

                      {/* Active Voucher */}
                      <td className="py-3.5 px-3 align-middle">
                        {contact.active_vouchers_count > 0 && contact.latest_voucher_code ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-gray-900">
                                {contact.latest_voucher_code}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(contact.latest_voucher_code!, 'Code copié')}
                                className="text-gray-400 hover:text-gray-700"
                                title="Copier le code bon d'achat"
                              >
                                {copiedValue === contact.latest_voucher_code ? (
                                  <Check size={12} className="text-emerald-600" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                            <div className="text-[11px] text-orange-600 font-semibold tabular-nums mt-0.5">
                              -{formatPrice(contact.latest_voucher_amount || 0)}
                              {contact.active_vouchers_count > 1 &&
                                ` (+${contact.active_vouchers_count - 1} autre)`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* Registration / First seen date */}
                      <td className="py-3.5 px-3 align-middle text-xs text-gray-600 tabular-nums whitespace-nowrap">
                        {formatDateFr(contact.created_at)}
                      </td>

                      {/* Direct Actions */}
                      <td className="py-3.5 pl-3 pr-5 align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          {contact.is_registered && contact.user_id ? (
                            <button
                              type="button"
                              onClick={() => openQuickVoucherModal(contact)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition whitespace-nowrap shrink-0"
                              title="Attribuer un bon d'achat à ce compte"
                            >
                              <Ticket size={14} />
                              <span>Bon d&apos;achat</span>
                            </button>
                          ) : (
                            <span
                              className="inline-flex items-center px-2.5 py-2 text-[11px] text-gray-400 border border-gray-200 rounded-lg whitespace-nowrap shrink-0"
                              title="Seuls les clients ayant créé un compte peuvent recevoir un bon d'achat"
                            >
                              Compte requis
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => openEmailComposer([contact])}
                            className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition whitespace-nowrap shrink-0"
                            title="Envoyer un email à ce client"
                          >
                            <Mail size={14} />
                            <span>Email</span>
                          </button>

                          <button
                            type="button"
                            disabled={!waNumber}
                            onClick={() => openWhatsappModal(contact)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-lg border transition whitespace-nowrap shrink-0 ${
                              waNumber
                                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                                : 'text-gray-300 bg-gray-50 border-gray-200 cursor-not-allowed'
                            }`}
                            title={
                              waNumber
                                ? 'Prévenir via WhatsApp'
                                : 'Aucun numéro de téléphone enregistré'
                            }
                          >
                            <MessageCircle size={14} />
                            <span>WhatsApp</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 border-t border-gray-200 bg-gray-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <div className="tabular-nums">
            Page <strong className="text-gray-900">{page}</strong> sur{' '}
            <strong className="text-gray-900">{totalPages}</strong> ·{' '}
            <strong className="text-gray-900">{totalCount.toLocaleString('fr-FR')}</strong> contact(s)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              <span>Précédent</span>
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Suivant</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1 : ATTRIBUTION RAPIDE DE BON D'ACHAT */}
      {voucherModalContact && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Ticket size={18} className="text-orange-500" />
                <h3 className="text-base font-bold text-gray-900">
                  Attribuer un bon d&apos;achat
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVoucherModalContact(null);
                  setIssuedVoucherSuccess(null);
                }}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {issuedVoucherSuccess ? (
              <div className="p-6 space-y-5">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-emerald-900">
                      Bon d&apos;achat attribué avec succès !
                    </p>
                    <p className="text-xs text-emerald-800 mt-1">
                      Il est déjà visible dans l&apos;espace client de{' '}
                      <strong>{issuedVoucherSuccess.contact.email}</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Code du bon</div>
                    <div className="font-mono text-lg font-bold text-gray-900 mt-0.5">
                      {issuedVoucherSuccess.code}
                    </div>
                    <div className="text-xs text-orange-600 font-semibold tabular-nums mt-0.5">
                      -{formatPrice(issuedVoucherSuccess.amount)}
                      {issuedVoucherSuccess.minimum_order_amount > 0 &&
                        ` · Min ${formatPrice(issuedVoucherSuccess.minimum_order_amount)}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(issuedVoucherSuccess.code, 'Code copié')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    <Copy size={14} />
                    <span>Copier</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">
                    Prévenir le client maintenant :
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const target = issuedVoucherSuccess.contact;
                        const voucherInfo = {
                          code: issuedVoucherSuccess.code,
                          amount: issuedVoucherSuccess.amount,
                          minCart: issuedVoucherSuccess.minimum_order_amount,
                          expiresAt: issuedVoucherSuccess.expires_at,
                        };
                        setVoucherModalContact(null);
                        setIssuedVoucherSuccess(null);
                        openEmailComposer([target], voucherInfo);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition"
                    >
                      <Mail size={16} />
                      <span>Prévenir par Email</span>
                    </button>

                    <button
                      type="button"
                      disabled={!normalizeAlgerianPhoneForWa(issuedVoucherSuccess.contact.phone)}
                      onClick={() => {
                        const target = issuedVoucherSuccess.contact;
                        const voucherInfo = {
                          code: issuedVoucherSuccess.code,
                          amount: issuedVoucherSuccess.amount,
                          minCart: issuedVoucherSuccess.minimum_order_amount,
                          expiresAt: issuedVoucherSuccess.expires_at,
                        };
                        setVoucherModalContact(null);
                        setIssuedVoucherSuccess(null);
                        openWhatsappModal(target, voucherInfo);
                      }}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold rounded-lg transition"
                    >
                      <MessageCircle size={16} />
                      <span>Prévenir sur WhatsApp</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setVoucherModalContact(null);
                      setIssuedVoucherSuccess(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleIssueVoucher} className="p-6 space-y-4">
                {/* Selected Customer Summary */}
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="text-sm font-bold text-gray-900">
                    {voucherModalContact.name || voucherModalContact.email.split('@')[0]}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {voucherModalContact.email}
                    {voucherModalContact.phone && ` · ${voucherModalContact.phone}`}
                  </div>
                </div>

                {/* Preset Barèmes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Valeur du bon d&apos;achat
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {tiers.map((tier) => {
                      const active =
                        !voucherForm.isCustomAmount && Number(voucherForm.amount) === Number(tier.amount);
                      return (
                        <button
                          key={tier.amount}
                          type="button"
                          onClick={() =>
                            setVoucherForm((prev) => ({
                              ...prev,
                              amount: tier.amount,
                              minimum_order_amount: tier.minCart,
                              isCustomAmount: false,
                            }))
                          }
                          className={`p-2.5 rounded-lg border text-left transition ${
                            active
                              ? 'border-orange-500 bg-orange-50 text-orange-900'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="text-sm font-bold tabular-nums">
                            {formatPrice(tier.amount)}
                          </div>
                          <div className="text-[11px] text-gray-500 tabular-nums mt-0.5">
                            Min {formatPrice(tier.minCart)}
                          </div>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() =>
                        setVoucherForm((prev) => ({
                          ...prev,
                          isCustomAmount: true,
                        }))
                      }
                      className={`p-2.5 rounded-lg border text-left transition ${
                        voucherForm.isCustomAmount
                          ? 'border-orange-500 bg-orange-50 text-orange-900'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-sm font-bold">Personnalisé</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">Montant libre</div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Montant du bon (DA)
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={voucherForm.amount}
                      onChange={(e) =>
                        setVoucherForm((prev) => ({
                          ...prev,
                          amount: Number(e.target.value),
                          isCustomAmount: true,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg tabular-nums focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Panier minimum hors livraison (DA)
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={voucherForm.minimum_order_amount}
                      onChange={(e) =>
                        setVoucherForm((prev) => ({
                          ...prev,
                          minimum_order_amount: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg tabular-nums focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Code + Expiry */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Code unique
                    </label>
                    <input
                      type="text"
                      value={voucherForm.code}
                      onChange={(e) =>
                        setVoucherForm((prev) => ({
                          ...prev,
                          code: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="Généré auto (ZRD-...)"
                      className="w-full px-3 py-2 text-sm font-mono uppercase border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-gray-700">Expiration</label>
                      <label className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={voucherForm.has_expiry}
                          onChange={(e) =>
                            setVoucherForm((prev) => ({ ...prev, has_expiry: e.target.checked }))
                          }
                          className="rounded border-gray-300 text-orange-500"
                        />
                        <span>Limiter la durée</span>
                      </label>
                    </div>
                    <input
                      type="date"
                      disabled={!voucherForm.has_expiry}
                      value={voucherForm.expires_at}
                      onChange={(e) =>
                        setVoucherForm((prev) => ({ ...prev, expires_at: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </div>
                </div>

                {/* Motif */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Motif d&apos;attribution
                  </label>
                  <input
                    type="text"
                    value={voucherForm.reason}
                    onChange={(e) => setVoucherForm((prev) => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {QUICK_VOUCHER_REASONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setVoucherForm((prev) => ({ ...prev, reason: r }))}
                        className="px-2.5 py-1 text-[11px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setVoucherModalContact(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={issuingVoucher}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60"
                  >
                    <Ticket size={16} />
                    <span>{issuingVoucher ? 'Attribution...' : "Attribuer le bon d'achat"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2 : ENVOI D'EMAIL CLIENT */}
      {emailModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-xl overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Mail size={18} className="text-orange-500" />
                <h3 className="text-base font-bold text-gray-900">
                  {emailModal.targets.length > 1
                    ? `Envoyer un email groupé (${emailModal.targets.length} clients)`
                    : 'Envoyer un email au client'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEmailModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendEmailSubmit} className="p-6 space-y-4">
              {!emailConfig.configured && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Envoi automatique Resend non configuré</p>
                    <p className="mt-0.5 text-amber-800">
                      Ajoutez votre clé API Resend dans <strong>Paramètres &gt; Compte</strong> pour envoyer
                      directement depuis le site, ou utilisez le bouton &laquo; Ouvrir dans mon client mail &raquo; ci-dessous.
                    </p>
                  </div>
                </div>
              )}

              {/* Recipients */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Destinataire(s)
                </label>
                <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-700 max-h-24 overflow-y-auto">
                  {emailModal.targets.map((t) => (
                    <div key={t.email_key} className="py-0.5">
                      <span className="font-semibold text-gray-900">{t.name || t.email}</span>
                      {t.name && <span className="text-gray-500"> &lt;{t.email}&gt;</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Templates */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Modèles rapides
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyEmailTemplate('voucher')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-100"
                  >
                    <Sparkles size={13} />
                    <span>Prévenir d&apos;un bon d&apos;achat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyEmailTemplate('promo')}
                    className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Offre / Nouveautés
                  </button>
                  <button
                    type="button"
                    onClick={() => applyEmailTemplate('custom')}
                    className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Message vierge
                  </button>
                </div>
              </div>

              {/* Active Voucher Card Toggle */}
              {emailModal.targets.length === 1 &&
                (emailModal.voucherOverride?.code || emailModal.targets[0].latest_voucher_code) && (
                  <label className="flex items-center gap-2.5 p-3 rounded-lg border border-orange-200 bg-orange-50/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailModal.includeVoucherCard}
                      onChange={(e) =>
                        setEmailModal((prev) => ({
                          ...prev,
                          includeVoucherCard: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-gray-900">
                        Inclure l&apos;encadré officiel du bon d&apos;achat{' '}
                        <span className="font-mono">
                          {emailModal.voucherOverride?.code ||
                            emailModal.targets[0].latest_voucher_code}
                        </span>
                      </span>
                      <span className="text-gray-600 ml-1">
                        (avec bouton direct vers Mon Espace Client)
                      </span>
                    </div>
                  </label>
                )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Objet de l&apos;email
                </label>
                <input
                  type="text"
                  required
                  value={emailModal.subject}
                  onChange={(e) =>
                    setEmailModal((prev) => ({ ...prev, subject: e.target.value }))
                  }
                  placeholder="Ex : Votre bon d'achat de 1 000 DA est disponible !"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Message</label>
                <textarea
                  rows={6}
                  required
                  value={emailModal.message}
                  onChange={(e) =>
                    setEmailModal((prev) => ({ ...prev, message: e.target.value }))
                  }
                  placeholder="Saisissez votre message personnalisé..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500"
                />
              </div>

              {sendEmailError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {sendEmailError}
                </div>
              )}

              <div className="pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                {emailModal.targets.length === 1 ? (
                  <a
                    href={`mailto:${encodeURIComponent(
                      emailModal.targets[0].email
                    )}?subject=${encodeURIComponent(emailModal.subject)}&body=${encodeURIComponent(
                      emailModal.message
                    )}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900"
                  >
                    <ExternalLink size={14} />
                    <span>Ouvrir dans mon client mail</span>
                  </a>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEmailModal((prev) => ({ ...prev, isOpen: false }))}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={sendingEmail}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60"
                  >
                    <Send size={15} />
                    <span>{sendingEmail ? 'Envoi en cours...' : "Envoyer l'email"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3 : NOTIFICATION WHATSAPP */}
      {waModal.contact && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageCircle size={18} className="text-emerald-600" />
                <h3 className="text-base font-bold text-gray-900">
                  Prévenir par WhatsApp
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setWaModal((prev) => ({ ...prev, contact: null }))}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    {waModal.contact.name || waModal.contact.email}
                  </div>
                  <div className="text-xs text-gray-600 tabular-nums mt-0.5">
                    +{normalizeAlgerianPhoneForWa(waModal.contact.phone)}
                  </div>
                </div>
                <div className="flex items-center gap-1 p-1 bg-white border border-gray-200 rounded-lg">
                  <button
                    type="button"
                    onClick={() => updateWaTemplate('fr', waModal.templateType)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                      waModal.lang === 'fr'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Français
                  </button>
                  <button
                    type="button"
                    onClick={() => updateWaTemplate('ar', waModal.templateType)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                      waModal.lang === 'ar'
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    العربية
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Modèle de message
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateWaTemplate(waModal.lang, 'voucher')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                      waModal.templateType === 'voucher'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Notifier un bon d&apos;achat
                  </button>
                  <button
                    type="button"
                    onClick={() => updateWaTemplate(waModal.lang, 'promo')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                      waModal.templateType === 'promo'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Annonce promo
                  </button>
                  <button
                    type="button"
                    onClick={() => updateWaTemplate(waModal.lang, 'custom')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                      waModal.templateType === 'custom'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Message libre
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Aperçu du message
                </label>
                <textarea
                  rows={7}
                  dir={waModal.lang === 'ar' ? 'rtl' : 'ltr'}
                  value={waModal.message}
                  onChange={(e) =>
                    setWaModal((prev) => ({ ...prev, message: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleCopy(waModal.message, 'Message copié')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  <Copy size={14} />
                  <span>Copier</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWaModal((prev) => ({ ...prev, contact: null }))}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    onClick={launchWhatsappUrl}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition"
                  >
                    <ExternalLink size={15} />
                    <span>Ouvrir WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
