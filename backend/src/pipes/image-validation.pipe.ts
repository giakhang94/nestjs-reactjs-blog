import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  transform(value: Express.Multer.File, metadata: ArgumentMetadata) {
    //"value" is an object containing the file's attributes and metadata
    const oneKb = 1000;
    const mineMap = [
      'image/jpg',
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
    ];
    if (value.size >= 20000 * oneKb)
      throw new BadRequestException('File size exceeds 20MB limit');
    if (!mineMap.includes(value.mimetype)) {
      throw new BadRequestException(`Unsupported file type: ${value.mimetype}`);
    }
    // return { message: 'Hello World!' }; <= decorator sẽ nhận cái này
    //return cái nào thì uploadFile(new ImageValidationPipe()) sẽ nhận cái đó.
    return value;
  }
}
