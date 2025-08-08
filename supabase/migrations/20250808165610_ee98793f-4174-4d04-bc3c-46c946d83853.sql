-- Update storage policies for order-attachments bucket to allow downloads
CREATE POLICY "Users can download their order attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'order-attachments');