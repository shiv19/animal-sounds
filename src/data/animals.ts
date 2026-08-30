export type Category = 'farm' | 'wild'

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
  // Then the wild ones
  { id: 'lion', name: 'Lion', category: 'wild', accent: '#E8B04B', emoji: '🦁' },
  { id: 'elephant', name: 'Elephant', category: 'wild', accent: '#9FB4C7', emoji: '🐘' },
  { id: 'monkey', name: 'Monkey', category: 'wild', accent: '#C49A6C', emoji: '🐵' },
  { id: 'tiger', name: 'Tiger', category: 'wild', accent: '#E8834A', emoji: '🐯' },
  { id: 'bear', name: 'Bear', category: 'wild', accent: '#A9805B', emoji: '🐻' },
  { id: 'frog', name: 'Frog', category: 'wild', accent: '#7FBF7F', emoji: '🐸' },
  { id: 'owl', name: 'Owl', category: 'wild', accent: '#B29A7E', emoji: '🦉' }
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
