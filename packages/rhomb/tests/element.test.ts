import { describe, it, beforeEach, expect } from "vitest";
import { type ReactiveProperties, RhombElement } from "../src/element";

class TestElement extends RhombElement {
  myProp: string = "my-prop-default";
  myBoolProp: boolean;
  myNumberProp: number;
  myCustomProp: string;
  static properties: ReactiveProperties = {
    myProp: { type: String, attribute: "my-prop", reflect: () => true },
    myBoolProp: {
      type: Boolean,
      attribute: "my-bool-prop",
      reflect: function (this: TestElement) {
        return this.myBoolProp;
      },
    },
    myNumberProp: { type: Number, attribute: "my-number-prop", reflect: true },
    myCustomProp: {
      type: String,
      attribute: "my-custom-prop",
      fromAttribute: (value: string | null) => (value ? `custom-${value}` : null),
      toAttribute: (value: string | null) => (value ? value.replace("custom-", "") : null),
      reflect: true,
    },
    mySetterProp: {
      type: String,
      descriptor: {
        set(this: TestElement, value: string) {
          this.setAttribute("setter-prop", value);
        },
      },
    },
  };
  mySetterProp: string;
  updateCount = 0;
  update() {
    this.updateCount++;
  }
}

customElements.define("test-element", TestElement);

describe("RhombElement", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should initialize properties", () => {
    const element = document.createElement("test-element") as TestElement;
    element.setAttribute("my-prop", "test");
    element.setAttribute("my-bool-prop", "");
    element.setAttribute("my-number-prop", "123");
    element.setAttribute("my-custom-prop", "test");
    document.body.appendChild(element);
    expect(element.myProp).toBe("test");
    expect(element.myBoolProp).toBe(true);
    expect(element.myNumberProp).toBe(123);
    expect(element.myCustomProp).toBe("custom-test");
  });

  it("should initialize properties from attributes", () => {
    const element = document.createElement("test-element") as TestElement;
    document.body.appendChild(element);
    expect(element.myProp).toBe("my-prop-default");
  });

  it("should reflect properties to attributes", () => {
    const element = document.createElement("test-element") as TestElement;
    document.body.appendChild(element);
    element.myProp = "new-test";
    element.myBoolProp = false;
    element.myNumberProp = 456;
    element.myCustomProp = "custom-new-test";
    expect(element.getAttribute("my-prop")).toBe("new-test");
    expect(element.hasAttribute("my-bool-prop")).toBe(false);
    expect(element.getAttribute("my-number-prop")).toBe("456");
    expect(element.getAttribute("my-custom-prop")).toBe("new-test");
  });

  it("should update properties when attributes change", async () => {
    const element = document.createElement("test-element") as TestElement;
    document.body.appendChild(element);
    element.setAttribute("my-prop", "changed");
    expect(element.myProp).toBe("changed");
    element.myProp = null;
    expect(element.hasAttribute("my-prop")).toBe(false);
  });

  it("should call setter when property is set", () => {
    const element = document.createElement("test-element") as TestElement;
    document.body.appendChild(element);
    element.mySetterProp = "setter-value";
    expect(element.getAttribute("setter-prop")).toBe("setter-value");
  });

  it("should not reflect when set by attribute", async () => {
    const element = document.createElement("test-element") as TestElement;
    document.body.appendChild(element);
    element.myProp = "initial";
    element.setAttribute("my-prop", "changed");
    expect(element.myProp).toBe("changed");
    expect(element.getAttribute("my-prop")).toBe("changed");
    element.myProp = "another-change";
    expect(element.getAttribute("my-prop")).toBe("another-change");
  });

  it("should merge update requests", async () => {
    const element = document.createElement("test-element") as TestElement;
    document.body.appendChild(element);
    for (let i = 0; i <= 10; i++) {
      element.myNumberProp = i;
    }
    expect(element.myNumberProp).toBe(10);
    await element.updateComplete;
    expect(element.updateCount).toBe(1);
  });
});
class ParentElement extends RhombElement {
  parentProp: string = "parent-prop-default";
  static properties: ReactiveProperties = {
    parentProp: { type: String, attribute: "parent-prop", reflect: true },
  };
}

class ChildElement extends ParentElement {
  childProp: string = "child-prop-default";
  static properties: ReactiveProperties = {
    childProp: { type: String, attribute: "child-prop", reflect: true },
  };
}

customElements.define("parent-element", ParentElement);
customElements.define("child-element", ChildElement);

describe("Inheritance", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should inherit properties from parent", () => {
    const childElement = document.createElement("child-element") as ChildElement;
    document.body.appendChild(childElement);

    expect(childElement.parentProp).toBe("parent-prop-default");
    expect(childElement.childProp).toBe("child-prop-default");
  });

  it("should reflect properties to attributes", () => {
    const childElement = document.createElement("child-element") as ChildElement;
    document.body.appendChild(childElement);
    childElement.parentProp = "new-parent-prop";
    childElement.childProp = "new-child-prop";
    expect(childElement.getAttribute("parent-prop")).toBe("new-parent-prop");
    expect(childElement.getAttribute("child-prop")).toBe("new-child-prop");
  });

  it("should update properties when attributes change", async () => {
    const childElement = document.createElement("child-element") as ChildElement;
    document.body.appendChild(childElement);
    childElement.setAttribute("parent-prop", "changed-parent-prop");
    expect(childElement.parentProp).toBe("changed-parent-prop");
    childElement.parentProp = null;
    expect(childElement.hasAttribute("parent-prop")).toBe(false);
  });
});
