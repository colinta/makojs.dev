import ejs from 'ejs';
import 'zx/globals';
import { Markdown } from './Markdown';

async function main() {
  await build();
}

export async function build() {
  console.log('Building...');
  let cwd = process.cwd();
  let docsDir = path.join(cwd, 'docs');

  let docs = await (async () => {
    let docs = await glob('**/*.md', { cwd: docsDir });
    return docs.map((doc) => {
      let html = doc.replace(/\.md$/, '.html');
      if (doc === 'README.md') {
        html = 'index.html';
      } else if (doc.endsWith('/README.md')) {
        html = doc.replace(/\/README\.md$/, '/index.html');
      }
      return { html, markdown: doc };
    });
  })();
  console.log(docs);

  // compile markdown to html
  for (let { html, markdown } of docs) {
    let mdPath = path.join(docsDir, markdown);
    let htmlPath = path.join(cwd, 'dist', html);
    let mdContent = fs.readFileSync(mdPath, 'utf-8');
    let md = new Markdown({ content: mdContent });
    let { attributes, body } = md.parseFrontMatter() as {
      attributes: {
        title: string | null;
      };
      body: string;
    };
    let htmlContent = await Markdown.parseMarkdown(body);
    fs.ensureDirSync(path.dirname(htmlPath));
    let templatePath = path.join(cwd, 'templates/default.ejs');
    let template = fs.readFileSync(templatePath, 'utf-8');
    let htmlContent2 = ejs.render(template, { content: htmlContent, title: attributes.title || '' });
    fs.writeFileSync(htmlPath, htmlContent2);
    console.log(`Built dist/${html}`);
  }

  console.log('Building done!');
}

(async () => {
  if (require.main === module) {
    await main();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});