const fs = require("fs");

const config = `
const CONFIG = {
    SUPABASE_URL: "${process.env.SUPABASE_URL}",
    SUPABASE_ANON_KEY: "${process.env.SUPABASE_ANON_KEY}"
};
`;

fs.writeFileSync("js/config.js", config);

console.log("Generated js/config.js");