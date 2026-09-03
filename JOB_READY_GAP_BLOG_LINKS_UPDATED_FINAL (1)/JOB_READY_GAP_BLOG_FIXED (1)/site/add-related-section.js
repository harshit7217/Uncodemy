const fs = require("fs");
const path = require("path");

const folderPath = __dirname;

// Jo section saari HTML files me chahiye
const newSection = `
<div class="rel-grid">
<a class="rel-card" href="ai-projects-for-students.html.html"><span class="t">Beginner AI Projects — Step-by-Step Guide</span><span class="m">Projects · 15 min</span></a>
<a class="rel-card" href="ai-projects-for-students.html.html"><span class="t">Machine Learning Projects That Impress Employers</span><span class="m">ML Projects · 14 min</span></a>
<a class="rel-card" href="ai-projects-for-students.html.html"><span class="t">NLP Projects for Beginners — Start Today</span><span class="m">NLP · 12 min</span></a>
<a class="rel-card" href="python-skills-required-for-data-analysts.html"><span class="t">Computer Vision Projects with Python</span><span class="m">CV · 16 min</span></a>
<a class="rel-card" href="what-companies-hire-for-data-science-skills-in-india.html"><span class="t">How to Build a GitHub Portfolio for Data Science</span><span class="m">Portfolio · 12 min</span></a>
<a class="rel-card" href="ai-projects-for-students.html.html"><span class="t">AI Project Ideas for Final Year Students</span><span class="m">Projects · 18 min</span></a>
</div>
`;

const files = fs.readdirSync(folderPath);

let updated = 0;
let skipped = 0;

files.forEach(file => {

    // Sirf HTML files
    if (!file.toLowerCase().endsWith(".html")) {
        return;
    }

    // Script ko skip karo agar JS folder me ho
    const filePath = path.join(folderPath, file);

    let html = fs.readFileSync(filePath, "utf8");

    // Agar rel-grid already hai to usko replace karo
    const relGridRegex = /<div\s+class=["']rel-grid["'][\s\S]*?<\/div>/i;

    if (relGridRegex.test(html)) {

        html = html.replace(relGridRegex, newSection.trim());

        fs.writeFileSync(filePath, html, "utf8");

        console.log(`✅ Updated: ${file}`);
        updated++;

    } else {

        // Agar rel-grid nahi hai to </body> se pehle add karo
        if (html.toLowerCase().includes("</body>")) {

            html = html.replace(
                /<\/body>/i,
                `${newSection}\n</body>`
            );

            fs.writeFileSync(filePath, html, "utf8");

            console.log(`➕ Added: ${file}`);
            updated++;

        } else {
            console.log(`⚠️ Skipped (no </body>): ${file}`);
            skipped++;
        }
    }
});

console.log("\n----------------------------");
console.log(`Updated/Added: ${updated}`);
console.log(`Skipped: ${skipped}`);
console.log("----------------------------");