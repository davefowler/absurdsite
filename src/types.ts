
export type Page = {
    id: number;
    path: string;
    title: string;
    content: string;
    template: string;
    data: string;
    published_date: string;
}


export type RawAsset = {
    path: string;
    content: string;
    type: string;
}

