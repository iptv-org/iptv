export default class NumberParser {
  async parse(number: string) {
    const parsed = parseInt(number)
    if (isNaN(parsed)) {
      throw new Error('numberParser:parse() Input value is not a number')
    }

    return parsed
  }
}
