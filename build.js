const fs = require("fs");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

const config = `
window.CONFIG = {
    SUPABASE_URL: "${url}",
    SUPABASE_ANON_KEY: "${key}"
};
`;

fs.writeFileSync("config.js", config);

console.log("config.js generated.");