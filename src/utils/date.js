export function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

export function shelfLifeToDays(shelfLife, unit = 'day') {
  if (!shelfLife || shelfLife <= 0) return 0
  const units = {
    day: 1,
    week: 7,
    month: 30,
    year: 365
  }
  return Math.floor(shelfLife * (units[unit] || 1))
}

export function calcRemainingDays(productionDate, shelfLife, shelfLifeUnit = 'day') {
  if (!productionDate || !shelfLife) return null
  const shelfLifeDays = shelfLifeToDays(shelfLife, shelfLifeUnit)
  const production = new Date(productionDate)
  const expireDate = new Date(production)
  expireDate.setDate(expireDate.getDate() + shelfLifeDays)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffTime = expireDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function getExpiryStatus(remainingDays) {
  if (remainingDays === null) return 'unknown'
  if (remainingDays < 0) return 'expired'
  if (remainingDays <= 3) return 'expiring'
  return 'fresh'
}

export function getDaysRemaining(productionDate, shelfLifeDays) {
  return calcRemainingDays(productionDate, shelfLifeDays, 'day')
}

export function isExpired(productionDate, shelfLifeDays) {
  const days = getDaysRemaining(productionDate, shelfLifeDays)
  return days !== null && days < 0
}

export function isExpiringSoon(productionDate, shelfLifeDays, threshold = 3) {
  const days = getDaysRemaining(productionDate, shelfLifeDays)
  return days !== null && days >= 0 && days <= threshold
}

export function getExpireDate(productionDate, shelfLifeDays) {
  if (!productionDate || !shelfLifeDays) return null
  const production = new Date(productionDate)
  const expireDate = new Date(production)
  expireDate.setDate(expireDate.getDate() + shelfLifeDays)
  return expireDate
}
