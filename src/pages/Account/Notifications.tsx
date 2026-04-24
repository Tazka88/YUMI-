import React from 'react';
import { Bell, Info } from 'lucide-react';

export default function Notifications() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
        <p className="text-gray-500 text-sm">Restez informé de vos commandes et des promotions exclusives.</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-8 rounded-3xl text-center">
        <div className="bg-white w-16 h-16 rounded-full shadow-sm flex items-center justify-center mx-auto mb-6">
          <Bell className="w-8 h-8 text-blue-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Aucune nouvelle notification</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
          Vous êtes à jour ! Nous vous enverrons une notification ici dès qu'il y aura du nouveau sur vos commandes ou des offres spéciales.
        </p>
      </div>

      <div className="space-y-4 pt-4">
        <h4 className="font-bold text-gray-900 flex items-center">
          <Info className="w-4 h-4 mr-2 text-gray-400" /> Préférences
        </h4>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900 text-sm">Emails promotionnels</p>
              <p className="text-xs text-gray-500">Recevoir des offres et codes promos par email</p>
            </div>
            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" name="toggle" id="toggle" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:right-0 checked:border-orange-500"/>
                <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
