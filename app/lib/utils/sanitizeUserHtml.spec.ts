import { removeHtmlTags, sanitizeUserHtml } from "./sanitizeUserHtml";

describe("sanitizeUserHtml", () => {
  test("keep allowed tags (unnested)", () => {
    const allowedHtml = `
        <h2>Headline 1</h2>
        <h3>Headline 2</h3>
        <h4>Headline 3</h4>
        <b>bold text</b>
        <i>italic</i>
        <strong>strong</strong>
        <a href="url">anchor text</a>
        <p>some paragraph</p>
      `;

    expect(sanitizeUserHtml(allowedHtml)).toBe(allowedHtml);
  });

  test("keep allowed tags (nested)", () => {
    const allowedHtml = `
        <h2>Headline 1</h2>
        <h3>Headline 2</h3>
        <h4>Headline 3</h4>              
        
        <p>
          some paragraph
          <a href="url"><i>italic</i></a>
          <strong>strong</strong>
          <b>bold text</b>
        </p>
      `;

    expect(sanitizeUserHtml(allowedHtml)).toBe(allowedHtml);
  });

  test("remove some disallowed tags", () => {
    expect(sanitizeUserHtml("<iframe><script>alert('');</script>")).toBe("");
  });

  test("allow some attributes in anchors", () => {
    expect(
      sanitizeUserHtml(
        `<a href="https://google.com" rel="noopener" target="_blank">link</a>`
      )
    ).toBe(
      `<a href="https://google.com" rel="noopener" target="_blank">link</a>`
    );
  });

  test("remove some attributes in anchors", () => {
    expect(
      sanitizeUserHtml(
        `<a onClick="alert('XSS')" onclick="alert('XSS')">link</a>`
      )
    ).toBe(`<a>link</a>`);
  });

  test("remove attributes from some other allowed tags", () => {
    expect(
      sanitizeUserHtml(
        `<b onClick="">text</b><strong onClick="">text</strong><h2 onClick=""></h2><h3 onClick=""></h3>`
      )
    ).toBe(`<b>text</b><strong>text</strong><h2></h2><h3></h3>`);
  });

  test("keep passed allowed tags", () => {
    expect(
      sanitizeUserHtml(`<b>text</b><strong>text</strong><h2></h2><h3></h3>`, {
        allowedTags: ["b", "strong"],
      })
    ).toBe(`<b>text</b><strong>text</strong>`);
  });

  test("remove disallowed attributes from passed allowed tags", () => {
    expect(
      sanitizeUserHtml(
        `<b onClick="">text</b><strong onClick="" data-testid="strong-text">text</strong><h2 onClick=""></h2><h3 onClick=""></h3>`,
        {
          allowedTags: ["b", "strong"],
          allowedAttributes: {
            strong: ["data-testid"],
          },
        }
      )
    ).toBe(`<b>text</b><strong data-testid="strong-text">text</strong>`);
  });
});

describe("removeHtmlTags", () => {
  test("remove tags from valid html", () => {
    expect(removeHtmlTags("<p>some text<p>")).toBe("some text");
  });

  test("remove tags from invalid html", () => {
    expect(removeHtmlTags("some</b> <div/>text</p>")).toBe("some text");
  });

  test("remove tags from invalid html", () => {
    expect(removeHtmlTags("<div>some text</p>")).toBe("some text");
  });
});
