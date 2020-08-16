const path = require('path');
const fs = require('fs');
const data = require('./out.json');

const byHash = {};
const byName = {};
data.forEach((item) => {
    byName[item.name.primaryName] = item;
    byHash[item.name.rhash] = item;
});
const names = Object.keys(byName);

const style = `
<style>
body {
    max-width: 800px;
    margin: 0 auto;
    font-size: 16px;
    font-family: system-ui;
}

.Constructor {
    color: #ce8500
}
.DataTypeKeyword {
    font-weight: bold;
}
.Var {
    color: #00a;
}
.NumericLiteral, .TextLiteral, .CharLiteral, .BooleanLiteral {
    color: green;
}


</style>
`;

// console.log(names.join('\n'));

// Things that don't have subItems don't get their own page
// Things with subitems get their own page
// Maybe thats it?

const hierarchy = { children: {} };
names.forEach((name) => {
    const parts = name === 'base..' ? ['base', '.'] : name.split('.');
    // console.log(name);
    let last = parts.pop();
    // if (last === '.')

    let current = hierarchy;
    parts.forEach((part) => {
        if (!current.children[part]) {
            current.children[part] = { index: null, children: {} };
        }
        current = current.children[part];
    });
    if (!current.children[last]) {
        current.children[last] = {
            index: null,
            children: {},
        };
    }
    current.children[last].index = byName[name];
});

const renderPage = (path, page) => {
    const namePage = path.join('.');
    return `
    <!doctype html>
    <meta charset=utf8>
    ${style}
    <title>${namePage}</title>
    <body>
        ${page.index ? renderItem(path, page.index) : ''}
        ${Object.keys(page.children)
            .sort()
            .map((key) => renderChild(path.concat([key]), page.children[key]))
            .join('\n')}
    </body>
    `;
};

const escapeHtml = (x) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const pathEscape = (p) => p.replace(/\./g, '_DOT_').replace(/:/g, '_COLON_');

const pathForHash = (hash) => {
    // const item = byHash[hash.slice(1)];
    // if (!item) {
    //     throw new Error('No hash ' + hash);
    // }
    return 'umm';
};

const renderBody = (body) =>
    `<code><pre>${body
        .map((i) => {
            if (i.kind === 'None') {
                return escapeHtml(i.contents);
            }
            if (i.kind.Other) {
                return `<span class="${i.kind.Other}">${escapeHtml(
                    i.contents,
                )}</span>`;
            }
            if (i.kind.WithHash) {
                return `<a class="${i.kind.WithHash.name}" href="${pathForHash(
                    i.kind.WithHash.hash,
                )}">${escapeHtml(i.contents)}</a>`;
            }
            return escapeHtml(i.contents);
        })
        .join('')}</pre></code>`;

const renderItem = (path, item) => {
    return `<h3>${path.join('.')}</h3>
    ${renderBody(item.body)}`;
};

const renderChild = (path, page) => {
    const childNames = Object.keys(page.children);
    // if (childNames.length) {
    //     return `<div class="child">
    //     <h3>
    //     <a href="${path[path.length - 1]}/index.html">
    //         ${path.join('.')}
    //         </a>
    //     </h3>
    //     </div>`;
    // }
    return `<div class="child" id="${
        page.index ? page.index.name.rhash : ''
    }"><h3>
        ${
            childNames.length
                ? `<a href="${pathEscape(path[path.length - 1])}/index.html">
            ${path.join('.')}
            </a>`
                : path.join('.')
        }
    </h3>
    ${page.index ? renderBody(page.index.body) : 'nope'}
    ${
        childNames.length
            ? 'Sub-items: ' +
              childNames
                  .map((name) => `<span class="sub-name">${name}</span>`)
                  .join(' ')
            : ''
    }
    </div>`;
};

const mkdirp = (d) => {
    if (!fs.existsSync(d)) {
        mkdirp(path.dirname(d));
        fs.mkdirSync(d);
    }
};

const traverse = (dest, trail, page) => {
    const fileName = path.join(dest, pathEscape(trail.join('/')), 'index.html');
    mkdirp(path.dirname(fileName));
    fs.writeFileSync(fileName, renderPage(trail, page), 'utf8');
    Object.keys(page.children).forEach((key) => {
        if (Object.keys(page.children[key].children).length) {
            traverse(dest, trail.concat([key]), page.children[key]);
        }
    });
};

fs.writeFileSync('hi.json', JSON.stringify(hierarchy, null, 2));
traverse('docs', [], hierarchy);
