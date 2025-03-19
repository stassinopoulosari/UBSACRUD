export const addEllipsis = ($parent) => {
		if (
			[].some.call($parent.children, ($child) =>
				$child.classList.contains("loading-ellipsis"),
			)
		) {
			[].filter
				.call($parent.children, ($child) =>
					$child.classList.contains("loading-ellipsis"),
				)
				.map(($ellipsis) => $ellipsis.classList.remove("stopped"));
			return $parent;
		}
		$parent.appendChild(
			classes(update(make("div"), { innerText: "..." }), [
				"loading-ellipsis",
			]),
		);
		return $parent;
	},
	separator = () => update(make("span"), { innerHTML: "&nbsp;" }),
	find = (id) => document.getElementById(id),
	make = (el) => document.createElement(el),
	stopEllipsis = ($el) => {
		if ($el.classList.contains("loading-ellipsis")) {
			$el.classList.add("stopped");
			return $el;
		}
		[].filter
			.call($el.children, ($child) =>
				$child.classList.contains("loading-ellipsis"),
			)
			.map(($ellipsis) => $ellipsis.classList.add("stopped"));
		return $el;
	},
	removeEllipsis = ($el) => {
		if ($el.classList.contains("loading-ellipsis")) {
			$el.remove();
		}
		[].filter
			.call($el.children, ($child) =>
				$child.classList.contains("loading-ellipsis"),
			)
			.map(($ellipsis) => $ellipsis.remove());
		return $el;
	},
	update = ($el, values) => {
		for (const valueKey in values) {
			$el[valueKey] = values[valueKey];
		}
		return $el;
	},
	style = ($el, values) => {
		for (const valueKey in values) {
			$el.style[valueKey] = values[valueKey];
		}
		return $el;
	},
	attr = ($el, values) => {
		for (const valueKey in values) {
			if (values[valueKey] !== null) {
				$el.setAttribute(valueKey, values[valueKey]);
			} else {
				$el.removeAttribute(valueKey);
			}
		}
		return $el;
	},
	classes = ($el, addClasses, removeClasses) => {
		(addClasses ?? []).forEach((className) => $el.classList.add(className));
		(removeClasses ?? []).forEach((className) =>
			$el.classList.add(className),
		);
		return $el;
	},
	// removeClasses = ($el, classes) => {
	//   classes.forEach((className) => $el.classList.remove(className));
	//   return $el;
	// },
	data = ($el, values) => {
		for (const valueKey in values) {
			$el.dataset[valueKey] = values[valueKey];
		}
		return $el;
	},
	children = ($el, $children) => {
		$children.forEach(($child) => $el.appendChild($child));
		return $el;
	},
	make$Page = (pageIDs) => {
		const $page = {};
		Object.keys(pageIDs).forEach((key) => {
			if (typeof pageIDs[key] === "string") {
				$page[key] = find(pageIDs[key]);
			} else if (typeof pageIDs[key] === "object") {
				$page[key] = make$Page(pageIDs[key]);
			} else {
				$page[key] = pageIDs[key];
			}
		});
		return $page;
	};

// Progress ellipsis elements
const progressEllipsis = () => {
	[].forEach.call(
		document.getElementsByClassName("loading-ellipsis"),
		($ellipsisElement) => {
			if ($ellipsisElement.classList.contains("stopped")) {
				$ellipsisElement.innerText = "...";
				return;
			}
			var innerText = $ellipsisElement.innerText;
			if (innerText === "º..") {
				innerText = ".º.";
			} else if (innerText === ".º.") {
				innerText = "..º";
			} else {
				innerText = "º..";
			}
			$ellipsisElement.innerText = innerText;
		},
	);
};
setInterval(progressEllipsis, 500);
progressEllipsis();
