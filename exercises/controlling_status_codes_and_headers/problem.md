# Controlling Response Status Codes and Headers

Boltzmann enforces certain metadata based on the type of value produced by a handler -- for example,
strings are assumed to be `Content-Type: text/plain`. Boltzmann will also fill in missing metadata
based on the manner in which the value was produced. Thrown values automatically produce a `500
Internal Server Error` status code if none is specified, while returned responses receive a `200 OK`
by default.

You can control all of these aspects of response metadata by setting specific
[Symbols](https://mdn.io/symbol.for) on your handler responses. Boltzmann looks for
`Symbol`-attached HTTP Metadata on any value your handlers or middleware produce, whether returned
or thrown. It uses symbols for this instead of setting, say, a `status` property on a response
object to avoid colliding with any data that might already be in the response.

Boltzmann sets symbols in the global registry for `status` and `headers`.

For example, to respond with a redirect from a Boltzmann handler, you would return
a value like this:

```js
return {
    [Symbol.for('status')]: 302,
    [Symbol.for('headers')]: { location: 'https://example.com/' }
  }
```

This lesson created a scaffold for you in `./http-metadata/`. `cd` there now.

In this lesson, we have two handlers: one throwing an error, and one returning a response. We want
to give the thrown error a `418` status code, while giving the plain response a `203` status code
and a `wow-great-header: a great value` response header.

Once you've added the headers, use `boltzshopper run .` to check your work! If it looks like it
passed, run `boltzshopper verify .`
