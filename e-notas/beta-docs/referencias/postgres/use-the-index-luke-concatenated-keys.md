---
source_url: https://use-the-index-luke.com/sql/where-clause/the-equals-operator/concatenated-keys
docs_version: Use The Index, Luke! (free web edition; PostgreSQL notes tested through PG 17)
---

# Concatenated Indexes (multi-column / composite)

Even though the database creates the index for the primary key automatically, there is still room for manual refinements if the key consists of multiple columns. In that case the database creates an index on all primary key columns—a so-called concatenated index (also known as multi-column, composite or combined index). Note that the column order of a concatenated index has great impact on its usability so it must be chosen carefully.

A concatenated index is just a B-tree index like any other that keeps the indexed data in a sorted list. The database considers each column according to its position in the index definition to sort the index entries. The first column is the primary sort criterion and the second column determines the order only if two entries have the same value in the first column and so on.

## Important

A concatenated index is one index across multiple columns. Indexes can only be used from left to right. If the first index column is not in the `WHERE` clause, the index is of little help for that query.

In general, a database can use a concatenated index when searching with the leading (leftmost) columns. An index with three columns can be used when searching for the first column, when searching with the first two columns together, and when searching using all columns.

## Important

The most important consideration when defining a concatenated index is how to choose the column order so it can be used as often as possible.

Even though a two-index solution can deliver good select performance, the single-index solution is preferable when one ordered composite index covers both access paths. It not only saves storage space, but also the maintenance overhead for the second index. The fewer indexes a table has, the better the `INSERT`, `DELETE` and `UPDATE` performance.

To define an optimal index you must understand more than just how indexes work—you must also know how the application queries the data. This means you have to know the column combinations that appear in the `WHERE` clause.

## PostgreSQL note (from site)

PostgreSQL may use a `Bitmap Index Scan` followed by a `Bitmap Heap Scan` for non-unique leading-column lookups: it first fetches all results from the index, sorts by physical heap location, then fetches table rows—reducing random I/O.
