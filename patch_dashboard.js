import fs from 'fs';

const path = 'src/pages/Admin/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add deliveryCompany state
content = content.replace(
  "const [selectedOrders, setSelectedOrders] = useState<number[]>([]);",
  "const [selectedOrders, setSelectedOrders] = useState<number[]>([]);\n  const [deliveryCompany, setDeliveryCompany] = useState<'dhd' | 'ecomdz'>('dhd');"
);

// Add sendToEcomDz after sendToDhd
const sendToDhdEndIdx = content.indexOf('const handleBulkDhd = async () => {');
if (sendToDhdEndIdx === -1) throw new Error("Could not find handleBulkDhd");

const ecomdzFunc = `
  const sendToEcomDz = async (id: number, silent = false) => {
    const token = localStorage.getItem('adminToken');
    let loadId;
    if (!silent) loadId = toast.loading('Envoi vers Ecom-DZ...');
    try {
      const res = await fetch(\`/api/admin/orders/\${id}\`, {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      const orderData = await res.json();
      
      if (!res.ok) throw new Error(orderData.error);
      
      const wilayaMatch = String(orderData.wilaya).match(/^(\\d+)/);
      const wilayaId = wilayaMatch ? wilayaMatch[1] : "16";

      const activeItems = orderData.items?.filter((i: any) => i.status !== 'cancelled') || [];
      const productsNames = activeItems.map((i: any) => \`\${i.quantity}x \${i.product_name}\`).join(', ') || 'Produit';

      const cleanPhone = (orderData.customer_phone || '').replace(/\\D/g, '');

      // Check commune format
      const communeRes = await fetch(\`/api/ecomdz/communes/\${wilayaId}\`);
      if (!communeRes.ok) throw new Error("Erreur de récupération des communes Ecom-DZ");
      const communeData = await communeRes.json();
      
      let matchedCommune = communeData.Commune?.[0]?.Commune || 'Alger Centre';
      if (orderData.commune) {
        const found = communeData.Commune?.find((c: any) => c.Commune.toLowerCase() === orderData.commune.toLowerCase());
        if (found) {
          matchedCommune = found.Commune;
        } else {
          const fuzzy = communeData.Commune?.find((c: any) => c.Commune.toLowerCase().includes(orderData.commune.toLowerCase()) || orderData.commune.toLowerCase().includes(c.Commune.toLowerCase()));
          if (fuzzy) matchedCommune = fuzzy.Commune;
        }
      }

      let codeStopdesk = undefined;
      if (orderData.stop_desk) {
        const stopdeskRes = await fetch(\`/api/ecomdz/stopdesk/\${wilayaId}\`);
        const stopdeskData = await stopdeskRes.json();
        
        let matchedStopdesk = null;
        if (orderData.office_name) {
          matchedStopdesk = stopdeskData.Commune?.find((s: any) => s.Libelle.toLowerCase().includes(orderData.office_name.toLowerCase()) || orderData.office_name.toLowerCase().includes(s.Libelle.toLowerCase()));
        }
        
        if (!matchedStopdesk && matchedCommune) {
           matchedStopdesk = stopdeskData.Commune?.find((s: any) => s.Commune.toLowerCase() === matchedCommune.toLowerCase());
        }
        
        if (matchedStopdesk) {
          codeStopdesk = matchedStopdesk.Code;
        } else {
          if (stopdeskData.Commune && stopdeskData.Commune.length > 0) {
            codeStopdesk = stopdeskData.Commune[0].Code;
          } else {
            throw new Error(\`Aucun bureau Stopdesk trouvé pour la wilaya \${wilayaId}\`);
          }
        }
      }

      const payload = {
        Colis: [{
          Echange: 0,
          Stopdesk: orderData.stop_desk ? 1 : 0,
          CodeStopdesk: codeStopdesk,
          NomComplet: orderData.customer_name || 'Client',
          Mobile_1: cleanPhone || '0000000000',
          Adresse: orderData.address || 'Aucune adresse',
          Wilaya: wilayaId,
          Commune: matchedCommune,
          Article: productsNames.substring(0, 150),
          Total: orderData.total_amount,
          NoteFournisseur: orderData.note || '',
          ID_Externe: orderData.order_id || \`#\${orderData.id}\`,
        }]
      };

      const deliveryRes = await fetch('/api/ecomdz/create-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const deliveryData = await deliveryRes.json();
      
      if (!deliveryRes.ok) {
        throw new Error(deliveryData.error || 'Erreur lors de l\\'envoi à Ecom-DZ');
      }

      const updateRes = await fetch(\`/api/admin/orders/\${id}/status\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({ status: 'shipped' })
      });
      
      if (!updateRes.ok) throw new Error('Commande envoyée, mais statut non mis à jour');

      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'shipped' } : o));
      
      if (!silent) {
        toast.success('Commande envoyée à Ecom-DZ avec succès', { id: loadId });
      }
      return true;
    } catch (err: any) {
      if (!silent) toast.error(err.message, { id: loadId });
      return false;
    }
  };

`;

content = content.substring(0, sendToDhdEndIdx) + ecomdzFunc + content.substring(sendToDhdEndIdx);

// Modify handleBulkDhd to handleDelivery
content = content.replace(
  "const handleBulkDhd = async () => {",
  `const handleBulkDelivery = async () => {
    if (selectedOrders.length === 0) return;
    const loadId = toast.loading(\`Envoi de \${selectedOrders.length} commandes vers \${deliveryCompany.toUpperCase()}...\`);
    let successCount = 0;
    
    for (const id of selectedOrders) {
      const success = deliveryCompany === 'dhd' ? await sendToDhd(id, true) : await sendToEcomDz(id, true);
      if (success) successCount++;
    }
    
    toast.success(\`\${successCount}/\${selectedOrders.length} envoyée(s) à \${deliveryCompany.toUpperCase()}\`, { id: loadId });
    setSelectedOrders([]);
  };
  const handleBulkDhd = async () => {`
);

// Replace UI handleBulkDhd to handleBulkDelivery, and add a dropdown
content = content.replace(
  `<button
                          onClick={handleBulkDhd}
                          className="text-sm bg-orange-500 border border-transparent text-white px-3 py-1.5 rounded hover:bg-orange-600 transition-colors flex items-center gap-1"
                        >
                          <Truck size={14} /> Envoyer à DHD
                        </button>`,
  `<div className="flex items-center gap-2">
                          <select 
                            value={deliveryCompany} 
                            onChange={(e) => setDeliveryCompany(e.target.value as 'dhd' | 'ecomdz')}
                            className="text-sm border-gray-300 rounded focus:ring-orange-500 focus:border-orange-500 h-[34px] py-1 px-2 bg-white"
                          >
                            <option value="dhd">DHD</option>
                            <option value="ecomdz">Ecom-DZ</option>
                          </select>
                          <button
                            onClick={handleBulkDelivery}
                            className="text-sm bg-orange-500 border border-transparent text-white px-3 py-1.5 rounded hover:bg-orange-600 transition-colors flex items-center gap-1 h-[34px]"
                          >
                            <Truck size={14} /> Envoyer {selectedOrders.length > 0 ? \`(\${selectedOrders.length})\` : ''}
                          </button>
                        </div>`
);

// Replace the single row delivery button to use deliveryCompany
content = content.replace(
  `<button 
                            onClick={() => sendToDhd(order.id)}
                            className="p-1.5 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors"
                            title="Envoyer à DHD"
                          >`,
  `<button 
                            onClick={() => deliveryCompany === 'dhd' ? sendToDhd(order.id) : sendToEcomDz(order.id)}
                            className="p-1.5 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors"
                            title={\`Envoyer à \${deliveryCompany.toUpperCase()}\`}
                          >`
);

fs.writeFileSync(path, content);
