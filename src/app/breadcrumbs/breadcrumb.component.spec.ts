import { inject, TestBed, ComponentFixture } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { By } from "@angular/platform-browser";
import { DebugElement, ApplicationRef, Directive, Input } from "@angular/core";
import { StoreModule, Store } from "@ngrx/store";

import { BreadcrumbItem } from "../datamodels";
import { BreadcrumbComponent } from "./breadcrumb.component";
import { AppState, appState } from "../app.store";
import { BreadcrumbActions } from "../reducers";

describe("Breadcrumb component", () => {
    let fixture: ComponentFixture<BreadcrumbComponent>;
    let component: BreadcrumbComponent;
    let store: Store<AppState>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                StoreModule.provideStore(appState)
            ],
            declarations: [ BreadcrumbComponent ],
            schemas: [ NO_ERRORS_SCHEMA ]
        });
        fixture = TestBed.createComponent(BreadcrumbComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    beforeEach(inject([ Store ], (appStore: Store<AppState>) => {
        store = appStore;
    }));

    it("should display simple text bredcrumbs", () => {
        // arrange
        let item1 = createBreadcrumbItem("item1");
        let item2 = createBreadcrumbItem("item2");
        store.dispatch({ type: BreadcrumbActions.BREADCRUMBS_UPDATED, payload: [item1, item2] });
        fixture.detectChanges();

        // act
        let breadcrumbs = fixture.debugElement.queryAll(By.css(".breadcrumb-item-title")).map(x => x.nativeElement.textContent);
        let routerLiks = fixture.debugElement.queryAll(By.css("a[routerLik]"));
        let clickable = fixture.debugElement.queryAll(By.css(".clickable"));

        // assert
        expect(routerLiks.length).toBe(0);
        expect(clickable.length).toBe(0);
        expect(breadcrumbs[0]).toBe(item1.title);
        expect(breadcrumbs[1]).toBe(item2.title);
    });

    it("should display bredcrumbs with router links", () => {
        // arrange
        let item1 = createBreadcrumbItem("item1", "linkTo");
        let item2 = createBreadcrumbItem("item2");
        store.dispatch({ type: BreadcrumbActions.BREADCRUMBS_UPDATED, payload: [item1, item2] });
        fixture.detectChanges();

        // act
        let routerLiks = fixture.debugElement.queryAll(By.css("a[ng-reflect-router-link]"))
            .map(x => x.nativeElement.attributes["ng-reflect-router-link"].value);
        let clickable = fixture.debugElement.queryAll(By.css(".clickable"));

        // assert
        expect(clickable.length).toBe(1, "breadcrumb should be clickable");
        expect(routerLiks.length).toBe(1);
        expect(routerLiks[0]).toBe(item1.navigationLink);
    });

    it("should display bredcrumbs with href links", () => {
        // arrange
        let item1 = createBreadcrumbItem("item1", "", "http://some.website.com");
        let item2 = createBreadcrumbItem("item2");
        store.dispatch({ type: BreadcrumbActions.BREADCRUMBS_UPDATED, payload: [item1, item2] });
        fixture.detectChanges();

        // act
        let routerLiks = fixture.debugElement.queryAll(By.css("a[ng-reflect-router-link]"))
            .map(x => x.nativeElement.attributes["ng-reflect-router-link"].value);
        let hrefLiks = fixture.debugElement.queryAll(By.css("a[href]"))
            .map(x => x.nativeElement.attributes["href"].value);
        let clickable = fixture.debugElement.queryAll(By.css(".clickable"));

        // assert
        expect(clickable.length).toBe(1, "breadcrumb should be clickable");
        expect(routerLiks.length).toBe(0);
        expect(hrefLiks.length).toBe(1);
        expect(hrefLiks[0]).toBe(item1.href);
    });

    let createBreadcrumbItem = function (title: string, link: string = "", href: string = "") {
        let item = new BreadcrumbItem();
        item.title = title;
        item.navigationLink = link;
        item.href = href;
        return item;
    };
});