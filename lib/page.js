module.exports = function(mongoose) {
  'use strict';

  var maxDocs = -1;

  var initialize = function(options) {
    if (options) {
      maxDocs = options.maxDocs || maxDocs;
    }
  };

  mongoose.Query.prototype.page = function(options, callback) {
    var defaults = {
        from: 0,
        limit: maxDocs,
        page: 1
      },
      query = this,
      wrap = {};

    options = options || defaults;
    options.limit = parseInt(options && options.limit ? options.limit : defaults.limit);
    options.page = (options && options.page ? parseFloat(options.page) - 1 : parseFloat(defaults.page) - 1);
    options.from = options.limit * options.page;

    if (maxDocs > 0 && (options.limit > maxDocs || options.limit === 0)) {
      options.limit = maxDocs;
    }

    query.model.count(query._conditions, function(err, total) {
      if (err) {
        return callback(err, null);
      }

      query
        .skip(options.from)
        .limit(options.limit)
        .exec(function(err, results) {
          if (err) {
            return callback(err);
          }

          options.page = options.page + 1;

          var to= options.from + options.limit;

          if (total === 0) {
            options.from = to = 0;
          } else if (to > total) {
            to = total;
          }
          
          wrap = {
            options: options,
            results: results || [],
            total: total,
            show_prev : options.from <= 1 ? false : true,
            show_next : to >= total ? false : true
          };

          callback(err, wrap);
        });
    });
  };

  return {
    initialize: initialize
  };
};
