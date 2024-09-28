import * as ui from "./ui.js";

export class TagManager {
  static tagManagers = {};
  static existingTags = new Set();
  static invertedSymbols = {};

  static getNewSymbolKey;
  static exportNewSymbol;

  static getTagManagerForTagView($tagView, existingTags) {
    if ($tagView.dataset.tagManager !== undefined) {
      return tagManagers[$tagView.dataset.tagManager];
    }
    return new TagManager($tagView, existingTags);
  }

  static makeTagKnown(tag) {
    tag = tag.trim();
    if (!TagManager.existingTags.has(tag)) {
      TagManager.existingTags.add(tag);
      if (!Object.hasOwn(this.invertedSymbols, tag)) {
        const newSymbolKey = (this.getNewSymbolKey ?? crypto.randomUUID)();
        this.invertedSymbols[tag] = newSymbolKey;
        if (this.exportNewSymbol !== undefined) {
          this.exportNewSymbol(newSymbolKey, tag);
        }
      }
    }
  }

  // Public properties
  uuid;
  onchange;

  //Private properties
  #$tagView;
  #$tagViewTags;
  #$tagViewAdd;
  #$tagViewSuggestions;
  #tags;
  #tagSuggestionIndex;

  asSymbolString() {
    return this.#tags
      .map((tag) => {
        if (TagManager.invertedSymbols[tag] === undefined) return tag;
        return `$(${TagManager.invertedSymbols[tag]})`;
      })
      .join(" ");
  }

  removeTag($tagElement) {
    const tagIndex = [].indexOf.call(this.#$tagViewTags.children, $tagElement);
    if (tagIndex === -1) throw "invalid indexOf result for tag removal";
    this.#tags.splice(tagIndex, 1);
    $tagElement.remove();
    if (this.onchange !== undefined && typeof this.onchange === "function")
      this.onchange();
  }

  popTag() {
    this.#$tagViewTags.lastChild.remove();
    this.#tags.pop();
    if (this.onchange !== undefined && typeof this.onchange === "function")
      this.onchange();
  }

  #generateSuggestions() {
    const content = this.#$tagViewAdd.value.trim().toLowerCase();
    this.#tagSuggestionIndex = -1;
    this.#$tagViewSuggestions.innerHTML = "";
    const suggestions = Array.from(TagManager.existingTags)
      .sort()
      .filter((tag) => tag.toLowerCase().startsWith(content));
    if (suggestions.length === 0) {
      this.#$tagViewSuggestions.style.display = "none";
      return;
    }
    this.#$tagViewSuggestions.style.display = "block";
    ui.children(
      this.#$tagViewSuggestions,
      suggestions.map((suggestion) =>
        ui.update(ui.make("div"), {
          innerText: suggestion,
          onmousedown: (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.appendTag(suggestion);
            this.#$tagViewAdd.value = "";
            this.#$tagViewAdd.focus();
            return false;
          },
        }),
      ),
    );
  }

  appendTag(tag) {
    tag = tag.trim();
    this.#tags.push(tag);
    const $newTag = ui.classes(
      ui.update(ui.make("div"), {
        innerText: tag,
        onclick: () => {
          this.removeTag($newTag);
          this.#$tagViewAdd.focus();
        },
        title: "click to delete",
      }),
      ["tag-view-tag"],
    );
    TagManager.makeTagKnown(tag);
    this.#$tagViewTags.appendChild($newTag);
    if (this.onchange !== undefined && typeof this.onchange === "function")
      this.onchange();
  }

  constructor($tagView, existingTags) {
    this.uuid = crypto.randomUUID();
    this.#tags = [];
    this.#tagSuggestionIndex = -1;

    if ($tagView.dataset.tagManager !== undefined) {
      throw "existing TagManager for element.";
    }

    this.#$tagView = ui.classes(ui.data($tagView, { tagManager: this.uuid }), [
      "tag-view",
    ]);
    this.#$tagViewTags = ui.classes(ui.make("div"), ["tag-view-tags"]);
    this.#$tagViewAdd = ui.update(
      ui.attr(ui.classes(ui.make("input"), ["tag-view-add"]), {
        type: "text",
        placeholder: "...",
        title: "add symbols",
      }),
      {
        onkeydown: (e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
          if (
            e.key === "Enter" ||
            (e.key === "Tab" &&
              TagManager.existingTags.has(this.#$tagViewAdd.value.trim()))
          ) {
            this.appendTag(this.#$tagViewAdd.value.trim());
            this.#$tagViewAdd.value = "";
          } else if (e.key === "Backspace" && this.#$tagViewAdd.value === "") {
            this.popTag();
          }
        },
        onkeyup: (e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            this.#tagSuggestionIndex += e.key === "ArrowUp" ? -1 : 1;
            if (this.#tagSuggestionIndex < 0) this.#tagSuggestionIndex = 0;
            if (
              this.#tagSuggestionIndex >=
              this.#$tagViewSuggestions.children.length
            )
              this.#tagSuggestionIndex =
                this.#$tagViewSuggestions.children.length - 1;
            [].forEach.call(
              this.#$tagViewSuggestions.children,
              ($child, i) =>
                ($child.style.backgroundColor =
                  i === this.#tagSuggestionIndex ? "#EEE" : "#FFF"),
            );
            this.#$tagViewAdd.value =
              this.#$tagViewSuggestions.children[
                this.#tagSuggestionIndex
              ].innerText;
          } else {
            this.#generateSuggestions();
          }
        },
        onfocus: () => this.#generateSuggestions(),
        onblur: () => {
          this.#tagSuggestionIndex = -1;
          this.#$tagViewSuggestions.innerHTML = "";
          this.#$tagViewSuggestions.style.display = "none";
        },
      },
    );
    this.#$tagViewSuggestions = ui.style(
      ui.classes(ui.make("div"), ["tag-view-suggestions"]),
      { display: "none" },
    );
    TagManager.tagManagers[this.uuid] = this;
    this.#$tagView.appendChild(this.#$tagViewTags);
    this.#$tagView.appendChild(
      ui.children(
        ui.update(ui.classes(ui.make("div"), ["tag-view-input-container"])),
        [this.#$tagViewAdd, this.#$tagViewSuggestions],
      ),
    );
    for (const symbol in TagManager.invertedSymbols) {
      TagManager.makeTagKnown(symbol);
    }
    existingTags.forEach((tag) => this.appendTag(tag));
  }
}
