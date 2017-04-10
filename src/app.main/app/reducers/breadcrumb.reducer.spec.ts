import { breadcrumbReducer, BreadcrumbActions } from './breadcrumb.reducer';
import { BreadcrumbItem } from '../datamodels';

describe('Breadcrumb reducer', () => {
    let state: BreadcrumbItem[];

    beforeEach(() => {
        const item = new BreadcrumbItem();
        item.backArrow = false;
        item.title = 'item';
        state = [ item ];
    });

    it('should return new breadcrumbs on BREADCRUMBS_UPDATED action', () => {
        // arrange
        const breadcrumbItem = new BreadcrumbItem();
        breadcrumbItem.title = 'new item';
        const newBreadcrumbs = [ breadcrumbItem ];

        // act
        const result = breadcrumbReducer(state, { type: BreadcrumbActions.BREADCRUMBS_UPDATED, payload: newBreadcrumbs });

        // assert
        expect(result).toBe(newBreadcrumbs);
    });

    it('should return old breadcrumbs by default', () => {
        // arrange
        const breadcrumbItem = new BreadcrumbItem();
        breadcrumbItem.title = 'new item';

        // act
        const result = breadcrumbReducer(state, { type: 'unknown_action', payload: [ breadcrumbItem ] });

        // assert
        expect(result).toBe(state);
    });
});
