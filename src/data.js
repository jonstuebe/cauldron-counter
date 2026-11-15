// Art and copy: SVG glyphs, customers and their lines.
export const GLYPH={
  drop:'<path d="M12 3C12 3 6 10 6 14a6 6 0 0 0 12 0C18 10 12 3 12 3Z"/>',
  bone:'<circle cx="6" cy="8" r="3"/><circle cx="6" cy="14" r="3"/><circle cx="18" cy="8" r="3"/><circle cx="18" cy="14" r="3"/><rect x="6" y="8.5" width="12" height="5" rx="1"/>',
  eye:'<ellipse cx="12" cy="12" rx="10" ry="6"/><circle cx="12" cy="12" r="3.4" fill="#fff" fill-opacity=".85"/><circle cx="12" cy="12" r="1.6"/>',
  flame:'<path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 2-8 1 1 2 2 2 4 1-2 2-5 2-8z"/>',
  crystal:'<path d="M12 2 19 10 12 22 5 10Z"/><path d="M5 10h14M12 2v20" stroke="#fff" stroke-opacity=".35" stroke-width="1"/>',
  leaf:'<path d="M4 20C4 10 10 4 21 3c0 11-6 17-17 17z"/><path d="M5 19 15 9" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>',
  moon:'<path d="M15 3a9 9 0 1 0 6 15 8 8 0 0 1-6-15z"/>',
  pepper:'<path d="M7 8c4-2 11 0 12 5 1 6-7 10-14 8 5-2 7-6 5-10-1-1-2-2-3-3z"/><path d="M8 8c0-2 1-4 4-5" stroke-width="2" fill="none" stroke="currentColor"/>',
  star:'<path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z"/>',
  drops:'<path d="M8 4C8 4 4 9 4 12a4 4 0 0 0 8 0C12 9 8 4 8 4Z"/><path d="M16 9c0 0-3.5 4-3.5 6.5a3.5 3.5 0 0 0 7 0C19.5 13 16 9 16 9Z"/>',
  coin:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5" fill="#fff" fill-opacity=".35"/>',
  scale:'<path d="M12 3c5 0 9 4 9 9-3-2-6-2-9 0-3-2-6-2-9 0 0-5 4-9 9-9z"/><path d="M3 15c3-2 6-2 9 0 3-2 6-2 9 0-1 4-5 7-9 7s-8-3-9-7z"/>',
  tear:'<path d="M12 21c-4 0-6-3-6-6 0-4 6-12 6-12s6 8 6 12c0 3-2 6-6 6z"/><circle cx="10" cy="15" r="1.6" fill="#fff" fill-opacity=".5"/>',
  feather:'<path d="M20 3C10 4 5 11 5 19l-1 2 2-1c8 0 14-6 14-17z"/><path d="M6 19 15 9" stroke="#fff" stroke-opacity=".45" stroke-width="1.5"/>',
  blob:'<path d="M6 10c0-4 4-6 7-5s6 2 6 6-2 4-1 7-3 4-6 3-6-1-6-5 0-3 0-6z"/>',
  moss:'<circle cx="8" cy="14" r="5"/><circle cx="15" cy="11" r="6"/><circle cx="14" cy="18" r="4"/>',
};
export const CUSTOMERS=[
  {name:'Wren, the courier',skin:'#e8b892',cloak:'#3f7a6a',hat:'cap',hatc:'#7a4a2a'},
  {name:'Old Marrow',skin:'#c99272',cloak:'#5a4a7a',hat:'hood'},
  {name:'Sister Pell',skin:'#f0cfb0',cloak:'#2f3d66',hat:'pointed',hatc:'#1f2a4a'},
  {name:'Tobble',skin:'#a8d08a',cloak:'#8a5a2a',hat:'hair',hatc:'#3a5a2a'},
  {name:'Captain Isolde',skin:'#8a5a3c',cloak:'#9a2f2f',hat:'cap',hatc:'#c9a24a'},
  {name:'Fennick',skin:'#e0a888',cloak:'#6a7a3a',hat:'hair',hatc:'#d06a2a'},
  {name:'Mags of the mill',skin:'#d9a07c',cloak:'#b89a5a',hat:'hood'},
  {name:'A nervous knight',skin:'#f2c9a8',cloak:'#7a8a9a',hat:'cap',hatc:'#a9b4c0'},
  {name:'Grandmother Hask',skin:'#e6c2a2',cloak:'#4a2f4a',hat:'pointed',hatc:'#2a1a2a'},
  {name:'Pim, age nine and a half',skin:'#f5d0b0',cloak:'#d07a9a',hat:'hair',hatc:'#5a3a2a'},
];
export const LINES=[
  n=>`Something to keep my lantern lit all night. Strength ${n}, please.`,
  n=>`My goat has the hiccups again. I need a ${n}.`,
  n=>`A strength ${n} tonic. Don’t ask what it’s for.`,
  n=>`The last shop gave me a ${n+1} and my eyebrows fell off. Exactly ${n} this time.`,
  n=>`Courage draught, strength ${n}. Quickly, I’m fighting a dragon at four.`,
  n=>`Grandmother swears by a ${n}. She is never wrong.`,
  n=>`I’ll need a ${n} before the moon is up.`,
  n=>`One sleeping draught. Strength ${n}, nothing stronger.`,
  n=>`Something for my bad knee. A ${n} usually does it.`,
];
export const THANKS=['Perfect. I can smell it working already.','Ah, just right. Keep the change.','That’s the stuff.','Lovely colour. Thank you!'];
