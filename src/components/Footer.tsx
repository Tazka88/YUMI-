import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Truck, MapPin } from 'lucide-react';

export default function Footer({ footerLinks, settings }: { footerLinks: any[], settings: any }) {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-6 mt-12">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        <div>
          <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Besoin d'aide ?</h4>
          <ul className="space-y-2 text-sm">
            {footerLinks.filter(l => l.column_id === 1).map(link => (
              <li key={link.id}>
                {link.url.startsWith('http') ? (
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">{link.name}</a>
                ) : (
                  <Link to={link.url} className="hover:text-orange-500 transition-colors">{link.name}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">À propos</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/blog" className="hover:text-orange-500 transition-colors">Notre Blog</Link>
            </li>
            {footerLinks.filter(l => l.column_id === 2).map(link => (
              <li key={link.id}>
                {link.url.startsWith('http') ? (
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-orange-500 transition-colors">{link.name}</a>
                ) : (
                  <Link to={link.url} className="hover:text-orange-500 transition-colors">{link.name}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Modes de paiement et livraison</h4>
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg border border-gray-700">
              <div className="bg-orange-500/20 p-2 rounded-full text-orange-500">
                <Truck size={20} />
              </div>
              <span className="text-sm font-medium text-white">Paiement à la livraison uniquement</span>
            </div>
            <div className="flex items-center gap-3 bg-gray-800 p-3 rounded-lg border border-gray-700">
              <div className="bg-orange-500/20 p-2 rounded-full text-orange-500">
                <MapPin size={20} />
              </div>
              <span className="text-sm font-medium text-white">Livraison sur 58 wilayas</span>
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Retrouvez-nous sur</h4>
          <div className="flex items-center gap-4">
            {settings.social_facebook_visible === '1' && settings.social_facebook && (
              <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-[#1877F2] hover:text-white transition-colors">
                <Facebook size={20} />
              </a>
            )}
            {settings.social_instagram_visible === '1' && settings.social_instagram && (
              <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-[#E4405F] hover:text-white transition-colors">
                <Instagram size={20} />
              </a>
            )}
            {settings.social_tiktok_visible === '1' && settings.social_tiktok && (
              <a href={settings.social_tiktok} target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-black hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
              </a>
            )}
            {settings.social_youtube_visible === '1' && settings.social_youtube && (
              <a href={settings.social_youtube} target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-[#FF0000] hover:text-white transition-colors">
                <Youtube size={20} />
              </a>
            )}
          </div>
          <div className="mt-6">
            <h4 className="text-white font-bold mb-3 uppercase text-sm tracking-wider">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {settings.contact_email && <li>{settings.contact_email}</li>}
              {settings.contact_phone && <li>{settings.contact_phone}</li>}
              {settings.contact_address && <li>{settings.contact_address}</li>}
            </ul>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-8 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
        {settings.copyright_text || `© ${new Date().getFullYear()} ZORANDO Algérie. Tous droits réservés.`}
      </div>
    </footer>
  );
}
