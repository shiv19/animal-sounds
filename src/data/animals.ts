export type Category = 'farm' | 'wild' | 'birds' | 'sea' | 'bugs'

/** A category, or 'all' for every animal at once. */
export type World = Category | 'all'

export interface CategoryInfo {
  id: Category
  name: string
  tagline: string
  /** Mascot shown on the picker card and world chips */
  emoji: string
  accent: string
  /** Spoken once when a slideshow in this world begins */
  greeting: string
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'farm', name: 'Farm', tagline: 'Barnyard friends', emoji: '🚜', accent: '#79a85b', greeting: 'To the farm!' },
  { id: 'wild', name: 'Wild', tagline: 'Jungle and savanna', emoji: '🦁', accent: '#e8a13c', greeting: 'Into the wild!' },
  { id: 'birds', name: 'Birds', tagline: 'Feathered friends', emoji: '🦜', accent: '#6b9bd1', greeting: 'Hello, birds!' },
  { id: 'sea', name: 'Sea', tagline: 'Under the waves', emoji: '🐋', accent: '#4fa8b8', greeting: 'Under the sea!' },
  { id: 'bugs', name: 'Bugs', tagline: 'Tiny and buzzy', emoji: '🐝', accent: '#d97ba6', greeting: 'Buzzy little bugs!' }
]

export const categoryInfo = (c: Category): CategoryInfo => CATEGORIES.find((cat) => cat.id === c)!

export const worldName = (w: World): string => (w === 'all' ? 'All animals' : categoryInfo(w).name)

export interface Animal {
  id: string
  name: string
  category: Category
  /** Soft accent color that washes the background while this animal is shown */
  accent: string
  /** Storybook stand-in for the photo, used in the Find It! scene */
  emoji: string
}

const photo = (id: string) => `${import.meta.env.BASE_URL}animals/photos/${id}.webp`
const sound = (id: string) => `${import.meta.env.BASE_URL}animals/sounds/${id}.mp3`
const nameClip = (id: string) => `${import.meta.env.BASE_URL}animals/names/${id}.mp3`

/** Recorded phrase clips ("Where is the cow?", "Yes! Cow!") in the same voice as the names. */
export const phraseClip = (slug: string) => `${import.meta.env.BASE_URL}animals/phrases/${slug}.mp3`

const defs: Array<Animal> = [
  // Farm first — the words toddlers say earliest
  { id: 'cow', name: 'Cow', category: 'farm', accent: '#8FBF6B', emoji: '🐮' },
  { id: 'dog', name: 'Dog', category: 'farm', accent: '#E8A87C', emoji: '🐶' },
  { id: 'cat', name: 'Cat', category: 'farm', accent: '#A9A4D4', emoji: '🐱' },
  { id: 'horse', name: 'Horse', category: 'farm', accent: '#C89B6C', emoji: '🐴' },
  { id: 'pig', name: 'Pig', category: 'farm', accent: '#F2A2B6', emoji: '🐷' },
  { id: 'sheep', name: 'Sheep', category: 'farm', accent: '#B7C4D8', emoji: '🐑' },
  { id: 'duck', name: 'Duck', category: 'farm', accent: '#F4C95D', emoji: '🦆' },
  { id: 'chicken', name: 'Chicken', category: 'farm', accent: '#F0A35E', emoji: '🐔' },
  { id: 'goat', name: 'Goat', category: 'farm', accent: '#B8B09A', emoji: '🐐' },
  { id: 'rabbit', name: 'Rabbit', category: 'farm', accent: '#F5B8C4', emoji: '🐰' },
  { id: 'donkey', name: 'Donkey', category: 'farm', accent: '#B8905F', emoji: '🫏' },
  { id: 'rooster', name: 'Rooster', category: 'farm', accent: '#E07A3F', emoji: '🐓' },
  { id: 'turkey', name: 'Turkey', category: 'farm', accent: '#C08552', emoji: '🦃' },
  { id: 'goose', name: 'Goose', category: 'farm', accent: '#A8B8C8', emoji: '🪿' },
  { id: 'mouse', name: 'Mouse', category: 'farm', accent: '#B0A8B8', emoji: '🐭' },
  // Then the wild ones
  { id: 'lion', name: 'Lion', category: 'wild', accent: '#E8B04B', emoji: '🦁' },
  { id: 'elephant', name: 'Elephant', category: 'wild', accent: '#9FB4C7', emoji: '🐘' },
  { id: 'monkey', name: 'Monkey', category: 'wild', accent: '#C49A6C', emoji: '🐵' },
  { id: 'tiger', name: 'Tiger', category: 'wild', accent: '#E8834A', emoji: '🐯' },
  { id: 'bear', name: 'Bear', category: 'wild', accent: '#A9805B', emoji: '🐻' },
  { id: 'frog', name: 'Frog', category: 'wild', accent: '#7FBF7F', emoji: '🐸' },
  { id: 'wolf', name: 'Wolf', category: 'wild', accent: '#93A3B8', emoji: '🐺' },
  { id: 'hippo', name: 'Hippo', category: 'wild', accent: '#A98FB5', emoji: '🦛' },
  { id: 'crocodile', name: 'Crocodile', category: 'wild', accent: '#7FA05A', emoji: '🐊' },
  { id: 'snake', name: 'Snake', category: 'wild', accent: '#9BB068', emoji: '🐍' },
  { id: 'squirrel', name: 'Squirrel', category: 'wild', accent: '#D09B62', emoji: '🐿️' },
  // Birds of a feather
  { id: 'owl', name: 'Owl', category: 'birds', accent: '#B29A7E', emoji: '🦉' },
  { id: 'parrot', name: 'Parrot', category: 'birds', accent: '#E0705A', emoji: '🦜' },
  { id: 'peacock', name: 'Peacock', category: 'birds', accent: '#58A893', emoji: '🦚' },
  { id: 'eagle', name: 'Eagle', category: 'birds', accent: '#B08D57', emoji: '🦅' },
  { id: 'flamingo', name: 'Flamingo', category: 'birds', accent: '#EE8FA8', emoji: '🦩' },
  // Under the waves
  { id: 'whale', name: 'Whale', category: 'sea', accent: '#6FA8D0', emoji: '🐋' },
  { id: 'dolphin', name: 'Dolphin', category: 'sea', accent: '#8FC0E0', emoji: '🐬' },
  { id: 'seal', name: 'Seal', category: 'sea', accent: '#A79BC8', emoji: '🦭' },
  { id: 'penguin', name: 'Penguin', category: 'sea', accent: '#7E96A8', emoji: '🐧' },
  // Tiny and buzzy
  { id: 'bee', name: 'Bee', category: 'bugs', accent: '#E8C24A', emoji: '🐝' },
  { id: 'cricket', name: 'Cricket', category: 'bugs', accent: '#A8B060', emoji: '🦗' },
  { id: 'mosquito', name: 'Mosquito', category: 'bugs', accent: '#C0A8B8', emoji: '🦟' }
]

export interface AnimalAssets extends Animal {
  photo: string
  sound: string
  /** Recorded name clip, spoken instead of browser TTS when present */
  recording?: string
}

export const ANIMALS: AnimalAssets[] = defs.map((a) => ({
  ...a,
  photo: photo(a.id),
  sound: sound(a.id),
  recording: nameClip(a.id)
}))

export const worldAnimals = (w: World): AnimalAssets[] =>
  w === 'all' ? ANIMALS : ANIMALS.filter((a) => a.category === w)
