import { describe, it, expect } from 'vitest'
import { parseCsv, forwardFill } from './csvParser'

describe('parseCsv', () => {
  it('parses plain rows and fields', () => {
    expect(parseCsv('a,b,c\nd,e,f')).toEqual([
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ])
  })

  it('keeps commas inside quoted fields', () => {
    expect(parseCsv('a,"b,c",d')).toEqual([['a', 'b,c', 'd']])
  })

  it('keeps newlines inside quoted fields (multi-line cells)', () => {
    expect(parseCsv('a,"line1\nline2",c')).toEqual([['a', 'line1\nline2', 'c']])
  })

  it('collapses escaped double-quotes', () => {
    expect(parseCsv('"she said ""hi"""')).toEqual([['she said "hi"']])
  })

  it('treats CRLF and lone CR as one row terminator', () => {
    expect(parseCsv('a,b\r\nc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
  })

  it('does not emit a phantom row for a trailing newline', () => {
    expect(parseCsv('a,b\n')).toEqual([['a', 'b']])
  })

  it('strips a leading UTF-8 BOM', () => {
    expect(parseCsv('﻿a,b')).toEqual([['a', 'b']])
  })

  it('returns an empty array for non-string input', () => {
    expect(parseCsv(null)).toEqual([])
    expect(parseCsv(42)).toEqual([])
  })
})

describe('forwardFill', () => {
  it('carries the last non-empty value down empty cells', () => {
    const rows = [
      ['DA-1', 'Week 1', 'a'],
      ['', '', 'b'],
      ['', 'Week 2', 'c'],
    ]
    expect(forwardFill(rows, [0, 1])).toEqual([
      ['DA-1', 'Week 1', 'a'],
      ['DA-1', 'Week 1', 'b'],
      ['DA-1', 'Week 2', 'c'],
    ])
  })

  it('resets the carry when a new value appears', () => {
    const rows = [
      ['DA-1', 'a'],
      ['', 'b'],
      ['DA-2', 'c'],
      ['', 'd'],
    ]
    expect(forwardFill(rows, [0])).toEqual([
      ['DA-1', 'a'],
      ['DA-1', 'b'],
      ['DA-2', 'c'],
      ['DA-2', 'd'],
    ])
  })

  it('does not mutate the input rows', () => {
    const rows = [['DA-1', 'a'], ['', 'b']]
    forwardFill(rows, [0])
    expect(rows[1][0]).toBe('')
  })
})
