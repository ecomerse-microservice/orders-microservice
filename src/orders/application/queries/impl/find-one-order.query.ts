/**
 * @class FindOneOrderQuery
 * @description Represents the intent to find a single order by its ID.
 */
export class FindOneOrderQuery {
  /**
   * @constructor
   * @param {string} id - The UUID/CUID of the order to find.
   */
  constructor(public readonly id: string) {}
}