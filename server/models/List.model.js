const { Timestamp } = require('firebase-admin/firestore');

class List {
    constructor(data) {
        this.id = data.id;
        this.name = data.name || '';
        this.description = data.description || '';
        this.location = data.location || '';
        this.created_by = data.created_by;
        this.created_by_name = data.created_by_name || '';
        this.created_date = data.created_date || Date.now().toString();
        this.updated_date = data.updated_date || new Date().toISOString();
        this.creator = data.creator || null;
        this.hotels = data.hotels || [];
        this.taglist = data.taglist || [];
        this.listPublic = data.listPublic ?? true;
        this.isDeleted = data.isDeleted ?? false;
        this.averageRating = Number(data.averageRating || 0);
        this.comments = Number(data.comments || 0);
        this.likes = Number(data.likes || 0);
        this.views = Number(data.views || 0);
        this.imageUrl = data.imageUrl || null;
    }

    toFirestore() {
        return {
            name: this.name,
            description: this.description,
            location: this.location,
            created_by: this.created_by,
            created_by_name: this.created_by_name,
            created_date: this.created_date,
            updated_date: this.updated_date,
            creator: this.creator,
            hotels: this.hotels,
            taglist: this.taglist,
            listPublic: this.listPublic,
            isDeleted: this.isDeleted,
            averageRating: this.averageRating,
            comments: this.comments,
            likes: this.likes,
            views: this.views,
            imageUrl: this.imageUrl
        };
    }

    static fromFirestore(snapshot, options) {
        const data = snapshot.data(options);
        return new List({
            id: snapshot.id,
            name: String(data.name || ''),
            description: String(data.description || ''),
            location: String(data.location || ''),
            created_by: String(data.created_by || ''),
            created_by_name: String(data.created_by_name || ''),
            created_date: String(data.created_date || Date.now().toString()),
            updated_date: String(data.updated_date || new Date().toISOString()),
            creator: data.creator || null,
            hotels: Array.isArray(data.hotels) ? data.hotels : [],
            taglist: Array.isArray(data.taglist) ? data.taglist : [],
            listPublic: Boolean(data.listPublic ?? true),
            isDeleted: Boolean(data.isDeleted ?? false),
            averageRating: Number(data.averageRating || 0),
            comments: Number(data.comments || 0),
            likes: Number(data.likes || 0),
            views: Number(data.views || 0),
            imageUrl: data.imageUrl || null
        });
    }
}

module.exports = List;
