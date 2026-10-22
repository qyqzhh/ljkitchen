import Dexie from 'dexie'

const db = new Dexie('ljkitchen_db')

db.version(1).stores({
  dishCategory: 'id, name, sort',
  dish: 'id, name, rating, review, imageData, createdAt, *categoryIds',
  ingredientCategory: 'id, name',
  ingredient: 'id, name, categoryId, productionDate, shelfLife, shelfLifeUnit, quantity, note, createdAt',
  backup: 'id, data, createdAt'
})

export default db
