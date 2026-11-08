source_url: https://testing-library.com/docs/queries/about/

# About Queries

## Overview

Queries are the methods that Testing Library gives you to find elements on the page. There are several types of queries ("get", "find", "query"); the difference between them is whether the query will throw an error if no element is found or if it will return a Promise and retry. Depending on what page content you are selecting, different queries may be more or less appropriate. See the priority guide for recommendations on how to make use of semantic queries to test your page in the most accessible way.

## Priority

Based on the Guiding Principles, your test should resemble how users interact with your code (component, page, etc.) as much as possible. With this in mind, we recommend this order of priority:

### 1. Queries Accessible to Everyone

Queries that reflect the experience of visual/mouse users as well as those that use assistive technology.

1. **`getByRole`**: This can be used to query every element that is exposed in the accessibility tree. With the `name` option you can filter the returned elements by their accessible name. This should be your top preference for just about everything. There's not much you can't get with this (if you can't, it's possible your UI is inaccessible). Most often, this will be used with the `name` option like so: `getByRole('button', {name: /submit/i})`.
2. **`getByLabelText`**: This method is really good for form fields. When navigating through a website form, users find elements using label text. This method emulates that behavior, so it should be your top preference.
3. **`getByPlaceholderText`**: A placeholder is not a substitute for a label. But if that's all you have, then it's better than alternatives.
4. **`getByText`**: Outside of forms, text content is the main way users find elements. This method can be used to find non-interactive elements (like divs, spans, and paragraphs).
5. **`getByDisplayValue`**: The current value of a form element can be useful when navigating a page with filled-in values.

### 2. Semantic Queries

1. **`getByAltText`**: If your element is one which supports `alt` text (`img`, `area`, `input`, and any custom element), then you can use this to find that element.
2. **`getByTitle`**: The title attribute is not consistently read by screenreaders, and is not visible by default for sighted users.

### 3. Test IDs

1. **`getByTestId`**: The user cannot see (or hear) these, so this is only recommended for cases where you can't match by role or text or it doesn't make sense (e.g. the text is dynamic).

## Types of Queries

| Type of Query | 0 Matches | 1 Match | >1 Matches | Retry (Async/Await) |
| --- | --- | --- | --- | --- |
| `getBy...` | Throw error | Return element | Throw error | No |
| `queryBy...` | Return `null` | Return element | Throw error | No |
| `findBy...` | Throw error | Return element | Throw error | Yes |
| `getAllBy...` | Throw error | Return array | Return array | No |
| `queryAllBy...` | Return `[]` | Return array | Return array | No |
| `findAllBy...` | Throw error | Return array | Return array | Yes |

## Manual Queries

On top of the queries provided by the testing library, you can use the regular `querySelector` DOM API to query elements. Note that using this as an escape hatch to query by class or id is not recommended because they are invisible to the user. Use a testid if you have to, to make your intention to fall back to non-semantic queries clear and establish a stable API contract in the HTML.
