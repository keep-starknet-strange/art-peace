export const encodeToLink = (description) => {
  // Replace Markdown-style links with actual HTML anchor tags
  const processedDescription = description.replace(
    /\[(.*?)\]\((.*?)\)/g,
    (match, text, link) => {
      return `<a class="Link__primary" href=${link} target="_blank" rel="noopener noreferrer">${text}</a>`;
    }
  );
  return { __html: processedDescription };
};
