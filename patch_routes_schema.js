import fs from 'fs';
const path = 'src/api/routes.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS commune VARCHAR(255)`.catch(err => console.error('Failed to add commune to profiles:', err));",
  "sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS commune VARCHAR(255)`.catch(err => console.error(err));\nsql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_company VARCHAR(50);`.catch(err => console.error(err));\nsql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS stop_desk BOOLEAN;`.catch(err => console.error(err));\nsql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS office_id VARCHAR(255);`.catch(err => console.error(err));\nsql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS office_name VARCHAR(255);`.catch(err => console.error(err));\nsql`ALTER TABLE orders ALTER COLUMN office_id TYPE VARCHAR(255);`.catch(err => console.error(err));"
);

fs.writeFileSync(path, content);
