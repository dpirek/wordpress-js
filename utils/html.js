function css(style) {
  return Object.entries(style).map(([key, value]) => {
    const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    return `${kebabKey}: ${value};`;
  }).join(' ');
}

function tag(name, content, attributes = {}) {
  const attrs = Object.entries(attributes).map(([key, value]) => ` ${key}="${value}"`).join('');
  return `<${name}${attrs}>${content}</${name}>`;
}

export {
  css,
  tag
};