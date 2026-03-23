/**
 * Per-cube query validation rules (key = dimension name only; cube name is the map key).
 *
 * type: 'dateRange'     — timeDimensions on `key`, max span = maxDays
 * type: 'stringList'    — filters on `key`, values must be in `allowed` (equals | in)
 * type: 'intRange'      — filters on `key`, integers in [min, max] (equals | in | gt | gte | lt | lte)
 * type: 'intList'       — filters on `key`, values must be in `allowed` (equals | in)
 */
// TODO add for key level
module.exports = {
  OrphanReturnManifest: [
    { type: 'dateRange', key: 'created', maxDays: 90 },
  ],
};
