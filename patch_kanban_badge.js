import fs from 'fs';
const path = 'src/pages/Admin/OrderKanban.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacement = `
                              <div className="text-xs text-gray-500 truncate mt-1" title={order.address}>
                                {order.wilaya} {order.commune && \`- \${order.commune}\`} - {order.address}
                              </div>
                              {order.delivery_company && (
                                <div className="mt-1.5 flex items-center gap-1">
                                  <span className={\`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold \${order.delivery_company === 'ecomdz' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}\`}>
                                    {order.delivery_company === 'ecomdz' ? 'ECOM-DZ' : 'DHD'}
                                  </span>
                                  {order.stop_desk && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">Stopdesk</span>}
                                </div>
                              )}
`;

content = content.replace(
  '<div className="text-xs text-gray-500 truncate mt-1" title={order.address}>\n                                {order.wilaya} {order.commune && `- ${order.commune}`} - {order.address}\n                              </div>',
  replacement
);

fs.writeFileSync(path, content);
