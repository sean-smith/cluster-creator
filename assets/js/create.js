// Click handler (jquery)

$(function() {

  // any config changes re-render the config file
  $("#options").change(function() {
    config()
	});

  // copy generated config
  $("#copy").click(function copy(element) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($('#code').text()).select();
    document.execCommand("copy");
    $temp.remove();
  });

  // show the initial config file
  config();

  // download the config file
  function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
  }

  // click handler for download button
  $("#download").click(function() {
    button = $(this);
    config_yml = $("#code").text();
    download('pcluster.yml', config_yml);
  });

  // Deploy API
  $("#api").click(function() {
    region = $("#region").val();
    link = `https://${region}.console.aws.amazon.com/cloudformation/home?region=${region}#/stacks/create/review?stackName=pcluster-api&templateURL=https://cluster-creator.s3.amazonaws.com/parallelcluster-api.yaml&param_EnableIamAdminAccess=true&param_CreateApiUserRole=false`;
    window.open(link, '_blank');
  });

  // Create Cluster Button
  $("#create").click(function() {
    config_yml = $("#code").text();
    config_base64 = btoa(config_yml);
    cluster_name = $("#cluster_name").val();
    region = $("#region").val();
    link = `https://${region}.console.aws.amazon.com/cloudformation/home?region=${region}#/stacks/create/review?stackName=cluster-creator-${cluster_name}&templateURL=https://cluster-creator.s3.amazonaws.com/assets/cfn/template.yml&param_APIStack=pcluster-api&param_ClusterName=${cluster_name}&param_ConfigFile=${config_base64}`;
    window.open(link, '_blank');
  });

  // queues section of the config
  function queues (options){
    slurm_queues = []
    for (let i = 1; i <= 10; i++) {
      if (i <= parseInt(options['num_queues'])) {
        $(`#queue_${i}`).show();
        slurm_queue = {
          Name: options[`name_queue_${i}`],
          Networking: {
            SubnetIds: [options['subnet_id']],
          },
          CapacityType: options[`capacity_type_queue_${i}`],
        };
        compute_resources = [];
        for (let j = 0; j < options[`instance_type_queue_${i}`].length; j++) {
          compute_resources.push({
            Name: `${options[`name_queue_${i}`]}-${options[`instance_type_queue_${i}`][j].replace('.', '-')}`,
            DisableSimultaneousMultithreading: options[`disable_hyperthreading_queue_${i}`],
            InstanceType: options[`instance_type_queue_${i}`][j],
            MinCount: parseInt(options[`slider_queue_${i}_min`]),
            MaxCount: parseInt(options[`slider_queue_${i}_max`]),
            Efa: {
              Enabled: options[`enable_efa_queue_${i}`],
              GdrSupport: options[`enable_gdr_queue_${i}`]
            }
          });
        }
        slurm_queue['ComputeResources'] = compute_resources;
        slurm_queues.push(slurm_queue);
      } else {
        $(`#queue_${i}`).hide();
      }
    }

    return {
      Scheduler: 'slurm',
      SlurmQueues: slurm_queues
    }
  }

  // image section of the config
  function image (options){
    image_obj = {
      Os: options['Os']
    };
    options['CustomAmi_on'] ? image_obj['CustomAmi'] = options['CustomAmi'] : "";
    return image_obj;
  }

  // head node section of the config
  function head (options){
    return {
      InstanceType: options['head_node_instance_type'],
      DisableSimultaneousMultithreading: options['disable_hyperthreading'],
      Networking: {
        SubnetId: options['subnet_id'],
      },
      Ssh: {
        KeyName: options['key_name']
      },
      LocalStorage: {
        RootVolume: {
          Size: parseInt(options['root_volume_size']),
        }
      },
      Dcv: {
        Enabled: options['enable_dcv']
      }
    }
  }

  function storage(options){
    storage_obj = {}
    storage_obj['Name'] = options['shared_storage_type'];
    storage_obj['StorageType'] = options['shared_storage_type'];
    storage_obj['MountDir'] = options['mount_point'];

    $(`.storage`).hide();

    // Existing Filesystems
    if (options['use_existing_fs_on']){
      switch (options['shared_storage_type']) {
        case 'FsxLustre':
          storage_obj['FsxLustreSettings'] = { FileSystemId: options['use_existing_fs'] };
        case 'Efs':
          storage_obj['EfsSettings'] = { FileSystemId: options['use_existing_fs'] };
          break;
        case 'Ebs':
          storage_obj['EbsSettings'] = { VolumeId: options['use_existing_fs'] };
          break;
      }
    } else {  // New Filesytems
      switch (options['shared_storage_type']) {
        case 'FsxLustre':
          $(`#fsx`).show();
          storage_obj['FsxLustreSettings'] = {
            StorageCapacity: options['fsx_capacity'],
            DeploymentType: options['fsx_type'],
            PerUnitStorageThroughput: options['fsx_per_unit_storage_throughput']
          };
          options['fsx_data_compression'] ? storage_obj['FsxLustreSettings']['DataCompressionType'] = 'LZ4' : "";
          options['import_path'] != '' ? storage_obj['FsxLustreSettings']['ImportPath'] = options['import_path'] : "";
          options['export_path'] != '' ? storage_obj['FsxLustreSettings']['ExportPath'] = options['export_path'] : "";
          break;
        case 'Efs':
          $(`#efs`).show();
          storage_obj['EfsSettings'] = {
            Encrypted: options['encrypted_efs_on'],
            PerformanceMode: options['performance_mode'],
            ThroughputMode: options['throughput_mode_on'] ? 'provisioned' : 'bursting',
          };
          options['encrypted_efs_on'] ? storage_obj['EfsSettings']['KmsKeyId'] = options['encrypted_efs'] : "";
          options['encrypted_efs_on'] ? storage_obj['EfsSettings']['KmsKeyId'] = options['encrypted_efs'] : "";
          break;
        case 'Ebs':
          $(`#ebs`).show();
          storage_obj['EbsSettings'] = {
            VolumeType: options['ebs_volume_type'],
            Size: options['ebs_volume_size'],
            Encrypted: options['encrypted_ebs_on'],
            DeletionPolicy: options['ebs_deletion_policy']
          };
          options['ebs_snapshot_id_on'] ? storage_obj['EbsSettings']['SnapshotId'] = options['ebs_snapshot_id'] : "";
          options['encrypted_ebs'] != '' ? storage_obj['EbsSettings']['KmsKeyId'] = options['encrypted_ebs'] : "";
          break;
      }
    }
    return [storage_obj];
  }

  function config(){

    const options = new Map();

    $('.pcluster-option').each(function(i, obj) {
      id = $(obj).attr('id');
      obj = $(`#${id}`);
      switch (obj.attr('type')) {
        case 'min-max-slider':
          obj.slider({});
          options[`${id}_min`] = obj.val().split(',')[0];
          options[`${id}_max`] = obj.val().split(',')[1];
          break;
        case 'slider':
          obj.slider({});
          options[id] = obj.val();
          break;
        case 'checkbox':
          options[id] = obj.is(":checked");
          break;
        default:
          options[id] = obj.val();
          break;
      }
    });

    template_obj = {};
    template_obj['Region'] = options['region'];
    template_obj['Image'] = image(options);
    template_obj['HeadNode'] = head(options);
    template_obj['Scheduling'] = queues(options);
    template_obj['SharedStorage'] = storage(options);

    $("#code").html(jsyaml.dump(template_obj));
      
  }


});
