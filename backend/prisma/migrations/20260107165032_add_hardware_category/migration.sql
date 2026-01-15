-- CreateTable (must be done first)
CREATE TABLE "hardware_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hardware_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hardware_categories_name_key" ON "hardware_categories"("name");

-- Insert default categories based on existing data
INSERT INTO "hardware_categories" ("id", "name", "description", "icon", "updatedAt")
SELECT 
    CONCAT('cat_', LOWER(REPLACE(category, ' ', '_'))),
    category,
    CASE category
        WHEN 'Microcontroller' THEN 'Programmable microcontroller boards'
        WHEN 'Sensor' THEN 'Sensors for data collection'
        WHEN 'Module' THEN 'Electronic modules and components'
        ELSE NULL
    END,
    CASE category
        WHEN 'Microcontroller' THEN 'Cpu'
        WHEN 'Sensor' THEN 'Radio'
        WHEN 'Module' THEN 'Box'
        ELSE NULL
    END,
    CURRENT_TIMESTAMP
FROM (SELECT DISTINCT category FROM "hardware") AS distinct_categories;

-- Add categoryId column (nullable first)
ALTER TABLE "hardware" ADD COLUMN "categoryId" TEXT;

-- Update existing hardware with correct categoryId
UPDATE "hardware" h
SET "categoryId" = hc."id"
FROM "hardware_categories" hc
WHERE h."category" = hc."name";

-- Now make categoryId NOT NULL
ALTER TABLE "hardware" ALTER COLUMN "categoryId" SET NOT NULL;

-- Drop the old category column
ALTER TABLE "hardware" DROP COLUMN "category";

-- AddForeignKey
ALTER TABLE "hardware" ADD CONSTRAINT "hardware_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "hardware_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
