import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import Stepper from "./Stepper.vue";

describe("Stepper", () => {
  it("affiche la valeur courante", () => {
    const wrapper = mount(Stepper, { props: { modelValue: 3 } });
    expect(wrapper.find("output").text()).toBe("3");
  });

  it("émet modelValue + 1 au clic sur +", async () => {
    const wrapper = mount(Stepper, { props: { modelValue: 3 } });
    await wrapper.find('button[aria-label="Plus"]').trigger("click");
    expect(wrapper.emitted("update:modelValue")).toEqual([[4]]);
  });

  it("émet modelValue - 1 au clic sur −, même sous zéro", async () => {
    const wrapper = mount(Stepper, { props: { modelValue: 0 } });
    await wrapper.find('button[aria-label="Moins"]').trigger("click");
    expect(wrapper.emitted("update:modelValue")).toEqual([[-1]]);
  });
});
