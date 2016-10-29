import { breadcrumbReducer, BreadcrumbActions } from "./breadcrumb.reducer";
import { BreadcrumbItem } from "../datamodels";

describe("Breadcrumb reducer", () => {
    let state: BreadcrumbItem[];

    beforeEach(() => {
        let item = new BreadcrumbItem();
        item.backArrow = false;
        item.title = "item";
        state = [ item ];
    });

    it("should return new breadcrumbs on BREADCRUMBS_UPDATED action", () => {
        // arrange
        let breadcrumbItem = new BreadcrumbItem();
        breadcrumbItem.title = "new item";
        let newBreadcrumbs = [ breadcrumbItem ];

        // act
        let result = breadcrumbReducer(state, { type: BreadcrumbActions.BREADCRUMBS_UPDATED, payload: newBreadcrumbs });

        // assert
        expect(result).toBe(newBreadcrumbs);
    });

    it("should return old breadcrumbs by default", () => {
        // arrange
        let breadcrumbItem = new BreadcrumbItem();
        breadcrumbItem.title = "new item";

        // act
        let result = breadcrumbReducer(state, { type: "unknown_action", payload: [ breadcrumbItem ] });

        // assert
        expect(result).toBe(state);
    });
});