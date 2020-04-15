/*!
 * Diva Utils
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

/**
 * Shuffle an array, using Durstenfeld shuffle
 * https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
 *
 * @param array {Array}
 * @return {Array}
 */
export function shuffleArray (array) {
  const a = array.slice()
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }

  return a
}

/**
 * Hash a string
 *
 * @param s {string}
 * @returns {number}
 */
export function hash (s) {
  let hash = 0

  if (s.length === 0) {
    return hash
  }
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

module.exports = { shuffleArray, hash }
