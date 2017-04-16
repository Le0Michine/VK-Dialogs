export class VersionComparerUtil {
    static compareVersions(v1: string, v2: string) {
        const v1split = v1.split('.').map(x => +x);
        const diff = v2.split('.').map(x => +x).map((x, i) => v1split[i] - x);
        const result = diff.find(x => x !== 0);
        return result > 0 ? 1 : result < 0 ? -1 : 0;
    }
}
