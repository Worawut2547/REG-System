export interface BookPathInterface {
    ID?: number;                // PK
    OriginalName?: string;      // ชื่อไฟล์เดิมตอนอัปโหลด
    StoredName?: string;        // ชื่อไฟล์จริงที่เก็บ (uuid.pdf)
    Path?: string;              // full path บน disk
    PublicPath?: string;        // path ที่ FE ใช้เปิดไฟล์ (/static/curriculums/uuid.pdf)
    MimeType?: string;          // ประเภทไฟล์ (application/pdf)
    Size?: number;              // ขนาดไฟล์ (byte)
    Checksum?: string;          // SHA-256
    Note?: string;              // คำอธิบาย

    CreatedAt?: Date;
    UpdatedAt?: Date;
    DeletedAt?: Date | null;
}
