export interface DataReader {
  read(path: string): string;
}

export class DomainService {
  constructor(private reader: DataReader) {}
  readData(): string {
    return this.reader.read('/tmp/data.txt');
  }
}
