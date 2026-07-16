import fs from 'fs';
const path = 'src/api/routes.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "const { customer_name, customer_email, customer_phone, wilaya, commune, address, note, items, delivery_cost: clientDeliveryCost, customer_user_id, stop_desk, office_id } = req.body;",
  "const { customer_name, customer_email, customer_phone, wilaya, commune, address, note, items, delivery_cost: clientDeliveryCost, customer_user_id, stop_desk, office_id, delivery_company, office_name } = req.body;"
);

content = content.replace(
  "INSERT INTO orders (customer_name, customer_email, customer_phone, wilaya, commune, address, note, total_amount, delivery_cost, customer_user_id, stop_desk, office_id)",
  "INSERT INTO orders (customer_name, customer_email, customer_phone, wilaya, commune, address, note, total_amount, delivery_cost, customer_user_id, stop_desk, office_id, delivery_company, office_name)"
);

content = content.replace(
  "VALUES (${customer_name || ''}, ${customer_email || null}, ${customer_phone || ''}, ${wilaya || ''}, ${commune || ''}, ${address || ''}, ${note || null}, ${calculatedTotal}, ${delivery_cost}, ${customer_user_id || null}, ${stop_desk ? true : false}, ${office_id || null})",
  "VALUES (${customer_name || ''}, ${customer_email || null}, ${customer_phone || ''}, ${wilaya || ''}, ${commune || ''}, ${address || ''}, ${note || null}, ${calculatedTotal}, ${delivery_cost}, ${customer_user_id || null}, ${stop_desk ? true : false}, ${office_id || null}, ${delivery_company || 'dhd'}, ${office_name || null})"
);

content = content.replace(
  "SELECT o.id, o.order_id, o.created_at, o.status, o.total_amount, o.delivery_cost, o.address, o.wilaya, o.commune, o.office_id, o.stop_desk, o.customer_name, o.customer_email, o.customer_phone, o.note, o.customer_user_id,",
  "SELECT o.id, o.order_id, o.created_at, o.status, o.total_amount, o.delivery_cost, o.address, o.wilaya, o.commune, o.office_id, o.office_name, o.delivery_company, o.stop_desk, o.customer_name, o.customer_email, o.customer_phone, o.note, o.customer_user_id,"
);

fs.writeFileSync(path, content);
