export class RomLoader {
  constructor(private fileUploadElement: HTMLInputElement) {}

  public async waitForRom(): Promise<ArrayBuffer> {
    if (!this.fileUploadElement.files || !this.fileUploadElement.files.length) {
      await this.waitForChangeEvent();
    }

    const content = await this.getFileContent(this.fileUploadElement.files[0]);
    return content;
  }

  private async getFileContent(file: File): Promise<ArrayBuffer> {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.readAsArrayBuffer(file);
      reader.onload = function (evt) {
        resolve(evt.target.result as ArrayBuffer);
      };
      reader.onerror = function (evt) {
        reject('An error occurred while reading the ROM.');
      };
    });
  }

  private async waitForChangeEvent(): Promise<void> {
    await new Promise((resolve) => {
      this.fileUploadElement.addEventListener('change', resolve);
    });
  }
}
