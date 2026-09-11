export const SEED_VERSION = 'community-v1';
export const SEED_POSTS = 162;
export const members = [
  ['alex.rivera', 'Alex Rivera', 'Lisbon', 'Slow mornings, architecture, and the next good coffee.'],
  ['maya.chen', 'Maya Chen', 'Kyoto', 'Finding color in everyday places. Photographer and matcha enthusiast.'],
  ['jordan.lee', 'Jordan Lee', 'Vancouver', 'Always taking the scenic route. Mountains, trails, and fresh air.'],
  ['taylor.brooks', 'Taylor Brooks', 'Melbourne', 'A little design, a lot of coffee, and weekends by the water.'],
  ['casey.morgan', 'Casey Morgan', 'San Diego', 'Ocean air and a camera in my backpack.'],
  ['sam.parker', 'Sam Parker', 'London', 'City walks, tiny cafes, and good books.'],
  ['nina.patel', 'Nina Patel', 'Jaipur', 'Color collector. Food lover. Making time for little adventures.'],
  ['leo.santos', 'Leo Santos', 'Porto', 'Coastal roads, home cooking, and sunset light.'],
  ['ava.wilson', 'Ava Wilson', 'Copenhagen', 'Simple spaces and happy plants.'],
  ['noah.kim', 'Noah Kim', 'Seoul', 'Street photography and late-night noodles.'],
  ['ella.martin', 'Ella Martin', 'Nice', 'Life outside, one seaside afternoon at a time.'],
  ['oliver.reed', 'Oliver Reed', 'Edinburgh', 'Hills, weather, and the perfect breakfast.'],
  ['mia.costa', 'Mia Costa', 'Florence', 'Sketchbooks, markets, and getting a little lost.'],
  ['liam.hayes', 'Liam Hayes', 'Queenstown', 'Weekend hikes and lakeside stops.'],
  ['zoe.clarke', 'Zoe Clarke', 'Amsterdam', 'Bikes, bakeries, and bright mornings.'],
  ['ethan.park', 'Ethan Park', 'Busan', 'Finding quiet corners in busy cities.'],
  ['isla.bennett', 'Isla Bennett', 'Brighton', 'By the sea, with a book and something warm to drink.'],
  ['lucas.silva', 'Lucas Silva', 'Rio de Janeiro', 'Chasing light along the coast.'],
  ['ruby.adams', 'Ruby Adams', 'Oslo', 'Fresh air and small, beautiful details.'],
  ['felix.wong', 'Felix Wong', 'Taipei', 'Night markets, trail days, and travel notes.'],
  ['luna.rossi', 'Luna Rossi', 'Bologna', 'Good food and even better company.'],
  ['oscar.james', 'Oscar James', 'Cape Town', 'A new trail is always a good idea.'],
  ['ivy.nakamura', 'Ivy Nakamura', 'Sapporo', 'Seasons, gardens, and weekend photography.'],
  ['milo.foster', 'Milo Foster', 'Auckland', 'Outdoors whenever possible.'],
] as const;
export const captions = [
  ['The kind of morning that makes the early alarm worth it. 🏔️', 'A little mountain air goes a long way.', 'Taking the long way home. No regrets.'],
  ['Salt in the air, sand in my shoes. A very good afternoon. 🌊', 'A quiet stretch of coastline, all to ourselves.', 'One more beach stop before heading home.'],
  ['Stayed for the sunset. Stayed a little longer after that. 🌴', 'Golden light and nowhere else to be.', 'Saving this view for a rainy day.'],
  ['The city looks different when you take your time. ✨', 'An evening walk turned into a favorite memory.', 'A few corners from this week’s wandering.'],
  ['Today’s plan: find a new road and see where it goes.', 'Every turn brought another reason to stop.', 'Small adventures are still adventures.'],
  ['Coffee first. Everything else can wait. ☕', 'Found a new favorite corner table.', 'A slow morning and a very good flat white.'],
  ['A coastal detour worth making. 💙', 'Walking until the only sound is the water.', 'A postcard kind of afternoon.'],
  ['No itinerary, just a good pair of shoes and curiosity.', 'Some days are better without a plan.', 'A few details I almost walked past.'],
  ['A reminder to look up once in a while. ☀️', 'Collecting moments from an ordinary, lovely day.', 'A brighter tomorrow starts with a little time outside.'],
] as const;
export const comments = [
  'The light in this is beautiful!', 'This looks like the perfect afternoon.', 'Adding this to my weekend inspiration.',
  'Such a peaceful view.', 'That color palette is so good.', 'Love the little details you noticed.',
  'Now I want to go for a walk.', 'A lovely reminder to slow down.', 'This made me smile today.',
  'What a great place to take a break.', 'Saving some inspiration for my next trip.', 'The best kind of detour.',
  'I could spend all day looking at that view.', 'A little fresh air makes such a difference.', 'Beautifully captured.',
  'This is exactly the weekend mood.', 'There is so much to notice here.', 'One of my favorites from this series.',
  'That looks like a wonderful stop.', 'Good coffee makes a good morning.', 'Love seeing these everyday moments.',
  'The scenic route always wins.', 'Such a warm and happy photo.', 'More afternoons like this, please.',
];
export function postPlan(index: number) {
  const author = index % 6 === 0 ? 0 : 1 + index % 23;
  const image = (index * 7 + author) % captions.length;
  return { key: `${SEED_VERSION}:post:${index}`, author, asset: `photo-${image + 1}`, caption: captions[image][Math.floor(index / 9) % 3] };
}
