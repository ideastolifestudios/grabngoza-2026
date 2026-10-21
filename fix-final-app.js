const fs = require('fs');

const appFile = 'src/App.tsx';
let content = fs.readFileSync(appFile, 'utf8');

console.log('🚀 Fixing misplaced App declaration...\n');

// 1. Strip the incorrectly placed export function App() headers
content = content.replace(/^[ \t]*export\s+function\s+App\(\)\s*\{\s*$/gm, '');
content = content.replace(/^[ \t]*function\s+App\(\)\s*\{\s*$/gm, '');

// 2. Strip duplicate/trailing exports and extra closing braces at the end of the file
content = content.replace(/(export\s+default\s+App;?\s*)+$/g, '');
content = content.replace(/(\}\s*)+$/g, ''); 

let lines = content.split('\n');

// 3. Find useDebounce to skip over it safely
let useDebounceStart = -1;
let braceCount = 0;
let useDebounceEnd = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('function useDebounce')) {
        useDebounceStart = i;
        braceCount = 0;
    }
    if (useDebounceStart !== -1 && useDebounceEnd === -1) {
        for (const char of lines[i]) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
        }
        if (braceCount === 0 && i > useDebounceStart) {
            useDebounceEnd = i;
        }
    }
The previous automated script made a mistake: it searched for `return (` to find the start of your main component, but it accidentally found the `return (` *inside* the `ErrorBoundary` class's `render()` method! This incorrectly injected `export function App() {` right into the middle of the error boundary logic, breaking the module scope.

Run this terminal command at your project root to surgically remove the misplaced injection, fix the braces, and correctly wrap your actual `App` component:

```bash
cat << 'EOF' > fix-app-scope.js
const fs = require('fs');

const appFile = 'src/App.tsx';
if (!fs.existsSync(appFile)) process.exit(1);

let lines = fs.readFileSync(appFile, 'utf8').split('\n');
let fixedLines = [];
let removedInjection = false;

console.log('🚀 Repairing ErrorBoundary & Component Scope in src/App.tsx...\n');

// 1. Remove the misplaced injection inside ErrorBoundary
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === 'export function App() {') {
        let j = i - 1;
        while(j >= 0 && lines[j].trim() === '') j--;
        // Check if it's sitting directly below the ErrorBoundary 'if' statement
        if (j >= 0 && lines[j].includes('if (this.state.hasError)')) {
            removedInjection = true;
            console.log('✅ Removed corrupted "export function App() {" from inside ErrorBoundary.');
            continue;
        }
    }
    fixedLines.push(line);
}

let content = fixedLines.join('\n');

if (removedInjection) {
    // Balance the stray '}' that the previous script appended to the EOF
    const lastBraceIdx = content.lastIndexOf('}');
    if (lastBraceIdx !== -1) {
        content = content.slice(0, lastBraceIdx) + content.slice(lastBraceIdx + 1);
    }
}

// 2. Locate the real App component and ensure it has a proper declaration
if (!/\b(function|const)\s+App\b/.test(content)) {
    console.log('⚠️ Main App component declaration is missing. Locating body...');
    
    // Find the end of the ErrorBoundary class to know where to start searching
    const ebEnd = content.indexOf('return this.props.children;');
    if (ebEnd !== -1) {
        // Find the '}' that closes render(), then the '}' that closes the class
        const classEnd = content.indexOf('}', content.indexOf('}', ebEnd) + 1);
        if (classEnd !== -1) {
            const before = content.slice(0, classEnd + 1);
            let after = content.slice(classEnd + 1);
            
            // Check if there's already a capitalized component function we can use
            const compMatch = after.match(/\b(?:function|const)\s+([A-Z][a-zA-Z0-9_]*)/);
            if (compMatch) {
                console.log(`✅ Aliasing existing component "${compMatch[1]}" as App.`);
                after = after.replace(/(export\s+default\s+App;?\s*)+$/g, '');
                after += `\nconst App = ${compMatch[1]};\nexport default App;\n`;
                content = before + after;
            } else {
                // If it's completely unwrapped, wrap it starting from the first hook or return
                const firstLogic = after.match(/\b(const\s+\[|useEffect|return\s*\()/);
                if (firstLogic) {
                    console.log(`✅ Wrapping the main application logic in "function App() {"`);
                    const logicIdx = after.indexOf(firstLogic[0]);
                    after = after.slice(0, logicIdx) + '\nfunction App() {\n' + after.slice(logicIdx);
                    // Attach closing brace and export
                    after = after.replace(/(export\s+default\s+App;?\s*)+$/g, '');
                    after += '\n}\n\nexport default App;\n';
                    content = before + after;
                }
            }
        }
    }
}

// Ensure exactly one clean default export at the bottom
content = content.replace(/(export\s+default\s+App;?\s*)+$/g, '\nexport default App;\n');

fs.writeFileSync(appFile, content, 'utf8');
console.log('\n🎉 Successfully repaired module scope syntax!');
