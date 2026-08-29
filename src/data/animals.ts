export type Category = 'farm' | 'wild'

export interface Animal {
  id: string
  name: string
  category: Category
  /** Soft accent color that washes the background while this animal is shown */
  accent: string
}

const photo = (id: string) => `${import.meta.env.BASE_URL}animals/photos/${id}.webp`
const sound = (id: string) => `${import.meta.env.BASE_URL}animals/sounds/${id}.mp3`

const defs: Array<Animal> = [
  // Farm first — the words toddlers say earliest
  { id: 'cow', name: 'Cow', category: 'farm', accent: '#8FBF6B' },
  { id: 'dog', name: 'Dog', category: 'farm', accent: '#E8A87C' },
  { id: 'cat', name: 'Cat', category: 'farm', accent: '#A9A4D4' },
  { id: 'horse', name: 'Horse', category: 'farm', accent: '#C89B6C' },
  { id: 'pig', name: 'Pig', category: 'farm', accent: '#F2A2B6' },
  { id: 'sheep', name: 'Sheep', category: 'farm', accent: '#B7C4D8' },
  { id: 'duck', name: 'Duck', category: 'farm', accent: '#F4C95D' },
  { id: 'chicken', name: 'Chicken', category: 'farm', accent: '#F0A35E' },
  { id: 'goat', name: 'Goat', category: 'farm', accent: '#B8B09A' },
  { id: 'rabbit', name: 'Rabbit', category: 'farm', accent: '#F5B8C4' },
  // Then the wild ones
  { id: 'lion', name: 'Lion', category: 'wild', accent: '#E8B04B' },
  { id: 'elephant', name: 'Elephant', category: 'wild', accent: '#9FB4C7' },
  { id: 'monkey', name: 'Monkey', category: 'wild', accent: '#C49A6C' },
  { id: 'tiger', name: 'Tiger', category: 'wild', accent: '#E8834A' },
  { id: 'bear', name: 'Bear', category: 'wild', accent: '#A9805B' },
  { id: 'frog', name: 'Frog', category: 'wild', accent: '#7FBF7F' },
  { id: 'owl', name: 'Owl', category: 'wild', accent: '#B29A7E' }
]

export interface AnimalAssets extends Animal {
  photo: string
  sound: string
  /** Future: path to a recorded voice clip, spoken instead of TTS when present */
  recording?: string
}

export const ANIMALS: AnimalAssets[] = defs.map((a) => ({
  ...a,
  photo: photo(a.id),
  sound: sound(a.id),
  recording: undefined
}))
