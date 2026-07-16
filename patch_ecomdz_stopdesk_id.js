import fs from 'fs';
const path = 'src/pages/Admin/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacement = `
      let codeStopdesk = undefined;
      if (orderData.stop_desk) {
        if (orderData.office_id && isNaN(Number(orderData.office_id))) {
          // If it's a string like '16A', use it directly
          codeStopdesk = orderData.office_id;
        } else {
          // Fallback if we only have the name
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
          } else if (stopdeskData.Commune && stopdeskData.Commune.length > 0) {
            codeStopdesk = stopdeskData.Commune[0].Code;
          } else {
            throw new Error(\`Aucun bureau Stopdesk trouvé pour la wilaya \${wilayaId}\`);
          }
        }
      }
`;

// we need to find the existing block:
/*
      let codeStopdesk = undefined;
      if (orderData.stop_desk) {
        const stopdeskRes = await fetch(`/api/ecomdz/stopdesk/${wilayaId}`);
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
            throw new Error(`Aucun bureau Stopdesk trouvé pour la wilaya ${wilayaId}`);
          }
        }
      }
*/

const oldBlock = `      let codeStopdesk = undefined;
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
      }`;

content = content.replace(oldBlock, replacement.trim());

fs.writeFileSync(path, content);
