import fs from 'fs';
const code = fs.readFileSync('src/pages/Checkout.tsx', 'utf-8');
const match = code.match(/<form onSubmit=\{handleSubmit\}.*?<\/form>/s);
if (match) {
  console.log("Found form, checking button inside form...");
  const btnMatch = code.match(/<button type="submit".*?<\/button>/s);
  console.log(btnMatch ? "Submit button found!" : "Submit button not found");
} else {
  console.log("Form not found");
}
