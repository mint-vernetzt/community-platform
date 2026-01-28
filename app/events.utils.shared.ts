export function hasSubline(event: {
  subline: string | null;
}): event is { subline: string } {
  return (
    event.subline !== null &&
    event.subline.trim() !== "" &&
    event.subline.trim() !== "<p></p>"
  );
}

export function hasDescription(event: {
  description: string | null;
}): event is { description: string } {
  return (
    event.description !== null &&
    event.description.trim() !== "" &&
    event.description.trim() !== "<p></p>"
  );
}
