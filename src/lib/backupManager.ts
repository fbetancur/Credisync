import { db } from './db';

/**
 * Sistema de backup y recuperación de datos
 */

export class BackupManager {
  /**
   * Crea un backup completo de la base de datos
   */
  async crearBackup(): Promise<string> {
    try {
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          empresas: await db.empresas.toArray(),
          usuarios: await db.usuarios.toArray(),
          rutas: await db.rutas.toArray(),
          clientes: await db.clientes.toArray(),
          productos: await db.productos.toArray(),
          creditos: await db.creditos.toArray(),
          cuotas: await db.cuotas.toArray(),
          pagos: await db.pagos.toArray(),
          syncQueue: await db.syncQueue.toArray(),
        },
      };

      return JSON.stringify(backup);
    } catch (error) {
      console.error('Error creando backup:', error);
      throw new Error('No se pudo crear el backup');
    }
  }

  /**
   * Descarga el backup como archivo JSON
   */
  async descargarBackup(): Promise<void> {
    try {
      const backupData = await this.crearBackup();
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `credisync-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('✅ Backup descargado exitosamente');
    } catch (error) {
      console.error('Error descargando backup:', error);
      throw new Error('No se pudo descargar el backup');
    }
  }

  /**
   * Restaura la base de datos desde un backup
   */
  async restaurarBackup(backupJson: string): Promise<void> {
    try {
      const backup = JSON.parse(backupJson);

      if (!backup.version || !backup.data) {
        throw new Error('Formato de backup inválido');
      }

      // Confirmar con el usuario
      const confirmar = confirm(
        '⚠️ ADVERTENCIA: Esto eliminará todos los datos actuales y los reemplazará con el backup. ¿Continuar?'
      );

      if (!confirmar) {
        return;
      }

      // Limpiar base de datos actual
      await db.empresas.clear();
      await db.usuarios.clear();
      await db.rutas.clear();
      await db.clientes.clear();
      await db.productos.clear();
      await db.creditos.clear();
      await db.cuotas.clear();
      await db.pagos.clear();
      await db.syncQueue.clear();

      // Restaurar datos
      if (backup.data.empresas?.length) await db.empresas.bulkAdd(backup.data.empresas);
      if (backup.data.usuarios?.length) await db.usuarios.bulkAdd(backup.data.usuarios);
      if (backup.data.rutas?.length) await db.rutas.bulkAdd(backup.data.rutas);
      if (backup.data.clientes?.length) await db.clientes.bulkAdd(backup.data.clientes);
      if (backup.data.productos?.length) await db.productos.bulkAdd(backup.data.productos);
      if (backup.data.creditos?.length) await db.creditos.bulkAdd(backup.data.creditos);
      if (backup.data.cuotas?.length) await db.cuotas.bulkAdd(backup.data.cuotas);
      if (backup.data.pagos?.length) await db.pagos.bulkAdd(backup.data.pagos);
      if (backup.data.syncQueue?.length) await db.syncQueue.bulkAdd(backup.data.syncQueue);

      console.log('✅ Backup restaurado exitosamente');
      alert('✅ Backup restaurado exitosamente. La página se recargará.');
      window.location.reload();
    } catch (error) {
      console.error('Error restaurando backup:', error);
      throw new Error('No se pudo restaurar el backup');
    }
  }

  /**
   * Carga un archivo de backup
   */
  async cargarArchivoBackup(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          await this.restaurarBackup(content);
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Error leyendo el archivo'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Crea un backup automático en localStorage
   */
  async crearBackupAutomatico(): Promise<void> {
    try {
      const backupData = await this.crearBackup();
      
      // Guardar en localStorage (máximo 5 backups)
      const backups = JSON.parse(localStorage.getItem('auto_backups') || '[]');
      backups.unshift({
        timestamp: new Date().toISOString(),
        data: backupData,
      });

      // Mantener solo los últimos 5 backups
      if (backups.length > 5) {
        backups.pop();
      }

      localStorage.setItem('auto_backups', JSON.stringify(backups));
      console.log('✅ Backup automático creado');
    } catch (error) {
      console.error('Error en backup automático:', error);
    }
  }

  /**
   * Obtiene lista de backups automáticos
   */
  obtenerBackupsAutomaticos(): Array<{ timestamp: string; size: number }> {
    try {
      const backups = JSON.parse(localStorage.getItem('auto_backups') || '[]');
      return backups.map((b: any) => ({
        timestamp: b.timestamp,
        size: new Blob([b.data]).size,
      }));
    } catch (error) {
      console.error('Error obteniendo backups:', error);
      return [];
    }
  }

  /**
   * Restaura un backup automático específico
   */
  async restaurarBackupAutomatico(timestamp: string): Promise<void> {
    try {
      const backups = JSON.parse(localStorage.getItem('auto_backups') || '[]');
      const backup = backups.find((b: any) => b.timestamp === timestamp);

      if (!backup) {
        throw new Error('Backup no encontrado');
      }

      await this.restaurarBackup(backup.data);
    } catch (error) {
      console.error('Error restaurando backup automático:', error);
      throw error;
    }
  }

  /**
   * Inicia backups automáticos periódicos
   */
  iniciarBackupsAutomaticos(): void {
    // Crear backup cada 6 horas
    setInterval(() => {
      this.crearBackupAutomatico();
    }, 6 * 60 * 60 * 1000);

    // Crear backup inicial
    this.crearBackupAutomatico();
  }

  /**
   * Exporta datos a CSV para análisis
   */
  async exportarPagosCSV(fechaInicio?: Date, fechaFin?: Date): Promise<void> {
    try {
      let pagos = await db.pagos.toArray();

      // Filtrar por fechas si se especifican
      if (fechaInicio || fechaFin) {
        pagos = pagos.filter(pago => {
          const fechaPago = new Date(pago.fecha);
          if (fechaInicio && fechaPago < fechaInicio) return false;
          if (fechaFin && fechaPago > fechaFin) return false;
          return true;
        });
      }

      // Enriquecer con datos de cliente
      const pagosEnriquecidos = await Promise.all(
        pagos.map(async (pago) => {
          const cliente = await db.clientes.get(pago.clienteId);
          return {
            fecha: pago.fecha,
            cliente: cliente?.nombre || 'Desconocido',
            documento: cliente?.documento || '',
            monto: pago.monto,
            tipo: pago.tipo,
            observaciones: pago.observaciones || '',
            sincronizado: pago.sincronizado ? 'Sí' : 'No',
          };
        })
      );

      // Convertir a CSV
      const headers = ['Fecha', 'Cliente', 'Documento', 'Monto', 'Tipo', 'Observaciones', 'Sincronizado'];
      const rows = pagosEnriquecidos.map(p => [
        p.fecha,
        p.cliente,
        p.documento,
        p.monto,
        p.tipo,
        p.observaciones,
        p.sincronizado,
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      // Descargar
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pagos-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('✅ CSV exportado exitosamente');
    } catch (error) {
      console.error('Error exportando CSV:', error);
      throw new Error('No se pudo exportar el CSV');
    }
  }
}

export const backupManager = new BackupManager();
