/**
 * Shared validation functions for cloud functions and tests.
 * These validators enforce the correctness properties defined in the design document.
 */

// --- Phone number validation (Requirements 3.1-3.4) ---

const PHONE_REGEX = /^1[3-9]\d{9}$/

/**
 * Validates a Chinese mobile phone number.
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhone(phone) {
  if (typeof phone !== 'string') return false
  return PHONE_REGEX.test(phone)
}

// --- Price / amount range validation (Requirements 5.1-5.6) ---

/**
 * Validates express order tip (0-99 inclusive).
 * @param {number} tip
 * @returns {boolean}
 */
function isValidExpressTip(tip) {
  if (typeof tip !== 'number' || !Number.isFinite(tip)) return false
  return tip >= 0 && tip <= 99
}

/**
 * Validates errand task price (1-999 inclusive).
 * @param {number} price
 * @returns {boolean}
 */
function isValidErrandPrice(price) {
  if (typeof price !== 'number' || !Number.isFinite(price)) return false
  return price > 0 && price <= 999
}

/**
 * Validates market goods price (> 0, <= 99999).
 * @param {number} price
 * @returns {boolean}
 */
function isValidMarketPrice(price) {
  if (typeof price !== 'number' || !Number.isFinite(price)) return false
  return price > 0 && price <= 99999
}

/**
 * Validates skill price (> 0).
 * @param {number} price
 * @returns {boolean}
 */
function isValidSkillPrice(price) {
  if (typeof price !== 'number' || !Number.isFinite(price)) return false
  return price > 0
}

// --- State transition validation (Requirements 6.1-6.4) ---

/**
 * Valid express order status transitions.
 * 0=待接单, 1=已接单, 2=配送中, 3=已完成, 4=已取消
 */
const EXPRESS_TRANSITIONS = {
  0: [1],
  1: [2],
  2: [3],
}

/**
 * Valid errand task status transitions.
 * 0=待接单, 1=进行中, 2=已完成, 3=已取消, 4=待确认
 */
const ERRAND_TRANSITIONS = {
  0: [1],
  1: [4],
  4: [2],
}

/**
 * Checks if a status transition is valid for express orders.
 * Terminal states (3, 4) have no outgoing transitions.
 * @param {number} from - current status
 * @param {number} to - target status
 * @returns {boolean}
 */
function isValidExpressTransition(from, to) {
  const allowed = EXPRESS_TRANSITIONS[from]
  if (!allowed) return false
  return allowed.includes(to)
}

/**
 * Checks if a status transition is valid for errand tasks.
 * Terminal states (2, 3) have no outgoing transitions.
 * @param {number} from - current status
 * @param {number} to - target status
 * @returns {boolean}
 */
function isValidErrandTransition(from, to) {
  const allowed = ERRAND_TRANSITIONS[from]
  if (!allowed) return false
  return allowed.includes(to)
}

// --- Room number validation (Requirements 11.1-11.2) ---

/**
 * Validates express order room number (non-empty, 1-10 chars).
 * @param {string} room
 * @returns {boolean}
 */
function isValidRoom(room) {
  if (typeof room !== 'string') return false
  const trimmed = room.trim()
  return trimmed.length >= 1 && trimmed.length <= 10
}

// --- Team max people validation (Requirements 8.1-8.2) ---

/**
 * Validates team max people (integer, 2-100).
 * @param {number} max
 * @returns {boolean}
 */
function isValidTeamMax(max) {
  if (typeof max !== 'number' || !Number.isFinite(max)) return false
  return Number.isInteger(max) && max >= 2 && max <= 100
}

// --- Non-empty string validation (used by contact, title, desc) ---

/**
 * Validates that a value is a non-empty, non-whitespace-only string.
 * @param {*} val
 * @returns {boolean}
 */
function isNonEmptyString(val) {
  if (typeof val !== 'string') return false
  return val.trim().length > 0
}

// --- Content length validation (Requirements 13.1-13.3) ---

/**
 * Validates forum post content length (1-1000).
 * @param {string} content
 * @returns {boolean}
 */
function isValidPostContent(content) {
  if (typeof content !== 'string') return false
  return content.length >= 1 && content.length <= 1000
}

/**
 * Validates forum comment content length (1-500).
 * @param {string} content
 * @returns {boolean}
 */
function isValidCommentContent(content) {
  if (typeof content !== 'string') return false
  return content.length >= 1 && content.length <= 500
}

module.exports = {
  PHONE_REGEX,
  isValidPhone,
  isValidExpressTip,
  isValidErrandPrice,
  isValidMarketPrice,
  isValidSkillPrice,
  EXPRESS_TRANSITIONS,
  ERRAND_TRANSITIONS,
  isValidExpressTransition,
  isValidErrandTransition,
  isValidRoom,
  isValidTeamMax,
  isNonEmptyString,
  isValidPostContent,
  isValidCommentContent,
}
